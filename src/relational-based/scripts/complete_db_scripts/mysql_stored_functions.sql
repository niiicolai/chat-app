USE chat;

-- ### FUNCTIONS ###


-- Convert bytes to kilobytes in SQL
DROP FUNCTION IF EXISTS bytes_to_kb;
DELIMITER //
CREATE FUNCTION bytes_to_kb(bytes BIGINT)
RETURNS DECIMAL(10,2)
NO SQL
BEGIN
    RETURN bytes / 1024;
END;
//
DELIMITER ;



-- Convert bytes to megabytes in SQL
DROP FUNCTION IF EXISTS bytes_to_mb;
DELIMITER //
CREATE FUNCTION bytes_to_mb(bytes BIGINT) 
RETURNS DECIMAL(10,2)
NO SQL
BEGIN
    RETURN bytes / 1048576;
END;
//
DELIMITER ;



-- Convert bytes to gigabytes in SQL
DROP FUNCTION IF EXISTS bytes_to_gb;
DELIMITER //
CREATE FUNCTION bytes_to_gb(bytes BIGINT) 
RETURNS DECIMAL(10,2)
NO SQL
BEGIN
    RETURN bytes / 1073741824;
END;
//
DELIMITER ;


-- Check if a datetime never expires
-- Convert null to true and a datetime to false
DROP FUNCTION IF EXISTS never_expires;
DELIMITER //
CREATE FUNCTION never_expires(datetime DATETIME)
RETURNS BOOLEAN
NO SQL
BEGIN
    IF datetime IS NULL THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
//
DELIMITER ;
