-- Create client_billing_rates table for per-client per-stop-type pricing
CREATE TABLE IF NOT EXISTS client_billing_rates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  clientLabel VARCHAR(255) NOT NULL,
  stopType VARCHAR(100) NOT NULL,
  rate DECIMAL(10,2) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_user_client (userId, clientLabel),
  INDEX idx_user_client_stop (userId, clientLabel, stopType),
  UNIQUE KEY unique_user_client_stop (userId, clientLabel, stopType)
);

-- Add clientLabel column to billing_records
ALTER TABLE billing_records 
ADD COLUMN IF NOT EXISTS clientLabel VARCHAR(255) AFTER userId,
ADD COLUMN IF NOT EXISTS routeHolderName VARCHAR(255) AFTER visitDate,
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'completed' AFTER routeHolderName;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_client_label ON billing_records (clientLabel);
CREATE INDEX IF NOT EXISTS idx_status ON billing_records (status);
