# Quick Testing Guide - Excel Uploads

## Files Modified
1. `Ren-Backend/controllers/outsiderPassController.js` - Outsider upload + list
2. `Ren-Backend/controllers/uploadController.js` - Student upload
3. `Ren-Backend/routes/teacherRoutes.js` - Student list endpoint

## How to Test

### 1. Test All Rows Get Inserted (Not Just First)
```bash
# Create Excel with 150+ rows
# Upload to POST /api/outsider/excel or POST /api/students/register

# Check response:
# {
#   "summary": {
#     "totalRows": 150,
#     "inserted": 145,      # Should NOT be 1!
#     "skipped": 5,
#     "duplicateSkipped": 0
#   }
# }

# Verify in database:
db.outsiderpasses.countDocuments()  # Should be 145
db.students.countDocuments()        # Should be 145
```

### 2. Test Duplicate Detection (Same Batch)
```bash
# Create Excel with duplicates:
# Row 1: email="test@example.com", phone="1234567890"
# Row 2: email="test@example.com", phone="9999999999"  # DUPLICATE!
# Row 3: email="other@example.com", phone="5555555555"

# Upload and check response:
# {
#   "summary": {
#     "totalRows": 3,
#     "inserted": 2,           # First occurrence only
#     "duplicateSkipped": 1,   # Second occurrence flagged
#   },
#   "duplicates": [
#     {
#       "sheet": "Sheet1",
#       "row": 2,
#       "reason": "Duplicate in batch (email/phone already exists)"
#     }
#   ]
# }
```

### 3. Test Database Duplicate Detection
```bash
# Upload same Excel twice

# First upload:
# "inserted": 100

# Second upload (same file):
# "inserted": 0
# "duplicateSkipped": 100  # All flagged as existing
```

### 4. Test Ticket Count Separation

#### Students API
```bash
GET /api/students

# Response shows INSIDER ticket count (sum of tokens):
# {
#   "ticketCount": 240,  # SUM of all student tokens
#   "paidCount": 120,    # Number of paid students
#   "data": [
#     {
#       "name": "John",
#       "token": 2,      # 2 free event tokens
#       "isPaid": true
#     }
#   ]
# }

# Calculation: 120 students × 2 tokens = 240 ticketCount
```

#### Outsiders API
```bash
GET /api/outsider/list

# Response shows OUTSIDER ticket count (count with valid days):
# {
#   "ticketCount": 180,  # Count of passes with Day1/2/3
#   "count": 200,        # Total outsider passes
#   "data": [
#     {
#       "name": "Jane",
#       "Day1": true,
#       "Day2": true,
#       "Day3": false
#     }
#   ]
# }

# Calculation: 180 outsiders have at least one Day marked true
```

### 5. Console Output to Watch

#### Outsider Upload
```
Outsider upload: parsed 150 rows from 1 sheets
Sample parsed rows: [...]
Batch insert: inserted 148 documents
Batch insert: inserted 2 documents
```

#### Student Upload
```
Batch insert: inserted 500 student documents
Batch insert: inserted 100 student documents
```

## Key Differences in Responses

### Old vs New Response Format

#### OLD (Before Fixes)
```json
{
  "summary": {
    "totalRows": 100,
    "inserted": 1,        // ❌ ONLY FIRST ROW!
    "skipped": 99
  }
}
```

#### NEW (After Fixes)
```json
{
  "summary": {
    "totalRows": 100,
    "inserted": 95,       // ✅ ALL VALID ROWS!
    "skipped": 3,
    "duplicateSkipped": 2, // ✅ NEW: Track duplicates
    "totalSkipped": 5
  },
  "duplicates": [          // ✅ NEW: Show duplicate details
    {
      "sheet": "Sheet1",
      "row": 50,
      "reason": "Duplicate in batch (email/phone already exists)"
    }
  ]
}
```

## Troubleshooting

### Issue: Still only inserting first row
- Check: Is the batch insert loop running? Should see `console.log` for each batch
- Check: Is `ordered: false` set in `insertMany()`?

### Issue: Duplicates not being detected
- Check: Is `seenDuplicates` Set being populated?
- Check: Are emails being normalized to lowercase?

### Issue: Ticket counts still wrong
- Check: For students, filter by `isPaid === true` before summing tokens
- Check: For outsiders, count only those with `Day1 || Day2 || Day3`

## Database Queries to Verify

```javascript
// Count outsiders with valid days
db.outsiderpasses.countDocuments({ $or: [{ Day1: true }, { Day2: true }, { Day3: true }] })

// Sum tokens from paid students
db.students.aggregate([
  { $match: { isPaid: true } },
  { $group: { _id: null, totalTokens: { $sum: "$token" } } }
])

// Find duplicates by email
db.outsiderpasses.aggregate([
  { $group: { _id: "$email", count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } }
])
```

## Success Checklist

- [ ] All 100+ rows inserted (not just first)
- [ ] Batch duplicates detected and skipped
- [ ] Database duplicates detected on second upload
- [ ] Student list shows correct token sum
- [ ] Outsider list shows correct day count
- [ ] Response includes `duplicateSkipped` field
- [ ] Console logs show batch processing
- [ ] No errors in server logs
