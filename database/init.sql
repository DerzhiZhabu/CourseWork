CREATE TABLE prime_users (
    id SERIAL PRIMARY KEY,
    orders_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    prime_id INTEGER NOT NULL REFERENCES prime_users(id),
    login VARCHAR,
    password VARCHAR,
    acces VARCHAR NOT NULL
);

CREATE TABLE refresh_token (
    token VARCHAR NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id),
    token_id VARCHAR PRIMARY KEY
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    prime_id INTEGER NOT NULL REFERENCES prime_users(id),
    number INTEGER,
    name VARCHAR(100),
    client VARCHAR(100),
    date DATE DEFAULT CURRENT_DATE,
    sost VARCHAR(50),
    phone VARCHAR(20),
    date_closed DATE,
    type VARCHAR(50) NOT NULL DEFAULT 'Легковое',
    price NUMERIC(12, 2) NOT NULL DEFAULT 0.00
);

CREATE TABLE workers (
    id SERIAL PRIMARY KEY,
    prime_id INTEGER NOT NULL REFERENCES prime_users(id),
    last_name VARCHAR(50) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    patronymic VARCHAR(50),
    procent NUMERIC(5, 2) DEFAULT 0.00,
    sost BOOL DEFAULT true
);

CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    prime_id INTEGER NOT NULL REFERENCES prime_users(id),
    name VARCHAR(100) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    price2 NUMERIC(10, 2)
);

CREATE TABLE orders_services (
    id SERIAL PRIMARY KEY,
    prime_id INTEGER NOT NULL REFERENCES prime_users(id),
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
    price NUMERIC(10, 2) NOT NULL,
    col INTEGER NOT NULL DEFAULT 1,
    worker_id INTEGER REFERENCES workers(id),
    sost INT NOT NULL DEFAULT 0,
    CONSTRAINT unique_order_service UNIQUE (order_id, service_id)
);

CREATE OR REPLACE FUNCTION update_order_price_from_services()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE orders
        SET price = price + (NEW.price * NEW.col)
        WHERE id = NEW.order_id;

        RETURN NEW;
    END IF;

    IF TG_OP = 'UPDATE' THEN
        UPDATE orders
        SET price = price + ((NEW.price * NEW.col) - (OLD.price * OLD.col))
        WHERE id = NEW.order_id;

        RETURN NEW;
    END IF;

    IF TG_OP = 'DELETE' THEN
        UPDATE orders
        SET price = price - (OLD.price * OLD.col)
        WHERE id = OLD.order_id;

        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_order_price_from_services
AFTER INSERT OR UPDATE OR DELETE ON orders_services
FOR EACH ROW
EXECUTE FUNCTION update_order_price_from_services();
