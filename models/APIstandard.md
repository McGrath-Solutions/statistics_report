Database Entity
=======================
- Standard Methods
  * initFromDatabaseObject
  * loadObjects
    > Fetch all objects of type entity in the database
  * load[Entity]ById
    > Fetch the object associated with an Id

- If Entity has relationship with Object
  * load[Object]Object
    > Fetch the Object associated with a passed in entity
    > Could be an array of objects if multiple
  * load[Object][Object2]Information (if Object1 has a relationship with Object2)

- If Entity is associated with a date property
  (Property is an optional field)
  * loadObjectsBy[property]Month
    > Given a month, return the objects in that month in an array
  * loadObjects[property]Before
    > Load all objects before the given date in an array
  * loadObjects[property]After
    > Load all objects after the given date in an array
  * loadObjects[property]Between
    > Load all objects between the given dates in an array