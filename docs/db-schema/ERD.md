# TerraFusion Database Entity Relationship Diagram

This document visually represents the relationships between tables in the TerraFusion database.

## Core Tables and Relationships

```
                                   +-------------+
                                   |             |
                                   |   property  |
                                   |             |
                                   +------+------+
                                          |
                                          |
                 +------------------------+------------------------+
                 |                        |                        |
                 |                        |                        |
        +--------v-------+      +---------v--------+     +--------v---------+
        |                |      |                  |     |                  |
        |  land_parcel   |      |   improvement    |     | collection_trans |
        |                |      |                  |     |                  |
        +----------------+      +------------------+     +------------------+
                                        
                                                          
        +----------------+      +------------------+     +------------------+
        |                |      |                  |     |                  |
        | special_assess |      |     levy_bill    |     |      payment     |
        |                |      |                  |     |                  |
        +--------^-------+      +--------^---------+     +--------^---------+
                 |                       |                        |
                 |                       |                        |
                 |                       |                        |
                 |                +------+------+                 |
                 |                |             |                 |
                 +----------------+   property  |                 |
                                  |             |                 |
                                  +------+------+                 |
                                         |                        |
                                         |                        |
                                   +-----v------+                 |
                                   |            |                 |
                                   |    levy    +<----------------+
                                   |            |
                                   +------------+
```

## Schema Details

1. **property** - Core entity representing a property
   - Primary Key: id (UUID)
   - Related tables: land_parcel, improvement, levy_bill, collection_transaction, special_assessment

2. **levy** - Tax levy information
   - Primary Key: id (UUID)
   - Related tables: levy_bill

3. **land_parcel** - Land parcel information
   - Primary Key: id (UUID)
   - Foreign Key: property_id references property(id)

4. **improvement** - Property improvements (buildings, etc.)
   - Primary Key: id (UUID)
   - Foreign Key: property_id references property(id)

5. **levy_bill** - Property tax bills
   - Primary Key: id (UUID)
   - Foreign Keys: 
     - property_id references property(id)
     - levy_id references levy(id)

6. **payment** - Payments for tax bills
   - Primary Key: id (UUID)
   - Foreign Key: bill_id references levy_bill(id)

7. **collection_transaction** - Collection actions
   - Primary Key: id (UUID)
   - Foreign Key: property_id references property(id)

8. **special_assessment** - Special assessments
   - Primary Key: id (UUID)
   - Foreign Key: property_id references property(id)

## Key Relationships

- One **property** can have multiple **land parcels**
- One **property** can have multiple **improvements**
- One **property** can have multiple **levy bills**
- One **property** can have multiple **collection transactions**
- One **property** can have multiple **special assessments**
- One **levy** can generate multiple **levy bills**
- One **levy bill** can have multiple **payments**