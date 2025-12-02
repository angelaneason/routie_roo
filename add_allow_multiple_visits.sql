ALTER TABLE users ADD COLUMN allowMultipleVisits INT NOT NULL DEFAULT 0 COMMENT '0 = prevent duplicates, 1 = allow same contact multiple times';
