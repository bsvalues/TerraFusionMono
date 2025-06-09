# Data Dictionary

This data dictionary documents each table's columns, types, and constraints in the TerraFusion database.

## Core Tables

### property
Core entity representing a real estate property in the system.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier for the property |
| *Additional fields not visible in migrations* | | | |

### levy
Represents tax levies imposed on properties.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier for the levy |
| *Additional fields not visible in migrations* | | | |

## Land & Improvement Tables

### land_parcel
Represents individual land parcels associated with properties.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier for the land parcel |
| property_id | UUID | NOT NULL, FOREIGN KEY | Reference to the property that owns this parcel |
| type_code | CHAR(10) | | Code indicating the land type/classification |
| acreage | NUMERIC(10,3) | | Size of the parcel in acres |
| valuation | NUMERIC(14,2) | | Assessed value of the land parcel |

### improvement
Represents structures and improvements on properties.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier for the improvement |
| property_id | UUID | NOT NULL, FOREIGN KEY | Reference to the property that has this improvement |
| type_code | CHAR(5) | | Code indicating the improvement type |
| year_built | INTEGER | | Year the improvement was constructed |
| replacement_cost | NUMERIC(14,2) | | Estimated cost to replace the improvement |

## Billing & Payment Tables

### levy_bill
Represents tax bills generated for properties based on levies.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier for the bill |
| property_id | UUID | FOREIGN KEY | Reference to the billed property |
| levy_id | UUID | FOREIGN KEY | Reference to the levy type |
| billed_amount | NUMERIC(14,2) | | Amount billed to the property owner |
| due_date | DATE | | Date by which payment is required |
| status | VARCHAR(20) | DEFAULT 'UNPAID' | Current status of the bill |

### payment
Represents payments made against levy bills.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier for the payment |
| bill_id | UUID | FOREIGN KEY | Reference to the bill being paid |
| tender_date | DATE | | Date when payment was received |
| amount | NUMERIC(14,2) | | Amount paid |

## Collections & Assessments Tables

### collection_transaction
Represents collection actions for properties.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier for the transaction |
| property_id | UUID | FOREIGN KEY | Reference to the associated property |
| tx_type | VARCHAR(20) | | Type of collection transaction |
| tx_date | DATE | | Date when the transaction occurred |
| amount | NUMERIC(14,2) | | Amount involved in the transaction |

### special_assessment
Represents special assessments applied to properties.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier for the assessment |
| property_id | UUID | FOREIGN KEY | Reference to the assessed property |
| agency_code | VARCHAR(10) | | Code for the agency imposing the assessment |
| description | VARCHAR(100) | | Description of the assessment purpose |
| assessment_amount | NUMERIC(14,2) | | Amount of the special assessment |
| start_year | INTEGER | | First year of assessment application |
| end_year | INTEGER | | Last year of assessment application |