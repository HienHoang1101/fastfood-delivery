#!/bin/bash

# Thoát ngay lập tức nếu có lệnh nào trả về lỗi.
set -e

# --- Các hàm hỗ trợ ---

# Hàm kiểm tra sự tồn tại của một lệnh
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Hàm khởi động các container cơ sở dữ liệu nếu chúng chưa chạy
start_databases() {
  echo "1. Starting database containers..."
  DATABASES=("user-db" "product-db" "order-db" "payment-db")
  for db in "${DATABASES[@]}"; do
    if [ ! "$(docker ps -q -f name=${db})" ]; then
      if [ "$(docker ps -aq -f status=exited -f name=${db})" ]; then
        echo "  Starting existing container ${db}..."
        docker start ${db}
      else
        echo "  Container ${db} not found. Running docker-compose up..."
        docker-compose up -d ${db}
      fi
    else
      echo "  Container ${db} is already running."
    fi
  done
}

# Hàm cấu hình tệp pg_hba.conf cho một dịch vụ cơ sở dữ liệu
configure_hba() {
  DB_SERVICE=$1
  echo "  Configuring ${DB_SERVICE}..."

  # Tạo tệp pg_hba.conf ngay trong thư mục hiện tại.
  # Cấu hình này không an toàn cho môi trường production nhưng chấp nhận được cho phát triển cục bộ.
  cat > pg_hba.conf <<EOL
# TYPE  DATABASE        USER            ADDRESS                 METHOD
host    all             all             0.0.0.0/0               md5
EOL

  # Sao chép tệp pg_hba.conf vào container
  docker cp pg_hba.conf "${DB_SERVICE}":/var/lib/postgresql/data/pg_hba.conf

  # Dọn dẹp tệp tạm
  rm pg_hba.conf
}

# Hàm khởi động lại các container cơ sở dữ liệu
restart_databases() {
  echo "3. Restarting database containers to apply changes..."
  docker-compose restart user-db product-db order-db payment-db
  echo "  Waiting for databases to be ready..."
  sleep 10
}

# Hàm tạo cơ sở dữ liệu nếu chúng chưa tồn tại
create_databases() {
  echo "4. Creating databases if they do not exist..."
  docker-compose exec -T user-db psql -U postgres -c "CREATE DATABASE user_db" || echo "  Database user_db already exists."
  docker-compose exec -T product-db psql -U postgres -c "CREATE DATABASE product_db" || echo "  Database product_db already exists."
  docker-compose exec -T order-db psql -U postgres -c "CREATE DATABASE order_db" || echo "  Database order_db already exists."
  docker-compose exec -T payment-db psql -U postgres -c "CREATE DATABASE payment_db" || echo "  Database payment_db already exists."
}

# Hàm khởi động lại pgAdmin
restart_pgadmin() {
  echo "5. Restarting pgAdmin..."
  docker-compose restart pgadmin
}

# --- Luồng thực thi chính ---

# Kiểm tra xem Docker và Docker Compose đã được cài đặt chưa
if ! command_exists docker || ! command_exists docker-compose; then
  echo "Error: Docker and/or Docker Compose are not installed. Please install them to continue."
  exit 1
fi

start_databases

echo "2. Configuring PostgreSQL authentication..."
configure_hba user-db
configure_hba product-db
configure_hba order-db
configure_hba payment-db

restart_databases
create_databases
restart_pgadmin

echo ""
echo "✅ Setup complete!"
echo "You can now connect to the databases from pgAdmin using the service names as hosts (e.g., 'user-db')."
echo "Default password for all databases is 'password'."