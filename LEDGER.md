# Layer 1 Ledger

Complete transaction history and audit trail for all Layer 1 operations.

## Overview

The Ledger page (`/ledger`) displays a comprehensive log of all Layer 1 transactions including:
- **Deposits** - Funds added to L1 accounts
- **Withdrawals** - Funds removed from L1 accounts  
- **Bridge Out** - L1 → L2 token transfers (soft-locks)
- **Bridge In** - L2 → L1 token returns
- **Transfers** - P2P L1 transfers
- **Settlements** - Final settlement of L2 positions to L1

## Features

### Filtering
- **By Type**: Filter by transaction type (deposit, withdraw, bridge, etc.)
- **My Transactions**: Toggle to show only your transactions when authenticated
- **Real-time Updates**: Refresh button to fetch latest transactions

### Transaction Details
Each transaction shows:
- Transaction type with color-coded badge
- Status (pending, completed, failed)
- Amount with +/- indicator
- From/To addresses
- Timestamp
- Transaction hash
- Lock ID (for bridges)
- L2 transaction ID (for bridges)

### Status Indicators
- 🟢 **Completed** - Transaction finalized
- 🟡 **Pending** - Transaction in progress
- 🔴 **Failed** - Transaction failed

## API Endpoint

### GET `/api/ledger`

Query the L1 ledger with optional filters.

**Query Parameters:**
- `address` - Filter by user L1 address
- `type` - Filter by transaction type
- `limit` - Number of results (default: 100)
- `offset` - Pagination offset

**Response:**
```json
{
  "transactions": [
    {
      "id": "tx_123",
      "type": "bridge_out",
      "from_address": "L1_ABC...",
      "to_address": "L2_DEF...",
      "amount": 1000,
      "timestamp": "2026-01-19T10:30:00Z",
      "status": "completed",
      "lock_id": "lock_456",
      "l2_tx_id": "l2_tx_789"
    }
  ],
  "total": 1
}
```

## L1 Server Requirements

The L1 server (localhost:8080) should implement:

### GET `/ledger`
Returns transaction history with filtering support.

**Implementation Example:**
```javascript
app.get('/ledger', async (req, res) => {
  const { address, type, limit = 100, offset = 0 } = req.query;
  
  // Query your L1 transaction database
  let query = db.transactions;
  
  if (address) {
    query = query.filter(tx => 
      tx.from_address === address || tx.to_address === address
    );
  }
  
  if (type) {
    query = query.filter(tx => tx.type === type);
  }
  
  const transactions = query
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(offset, offset + limit);
  
  res.json({
    transactions,
    total: query.length
  });
});
```

## Integration with Settlement SDK

The ledger automatically tracks:
1. Bridge operations from `settlement-sdk.js`
2. Soft-lock creation and release
3. L1 → L2 deposits
4. L2 → L1 withdrawals

## Usage

```typescript
// Visit the ledger page
window.location.href = '/ledger';

// Or fetch ledger data directly
const response = await fetch('/api/ledger?address=L1_ABC...');
const data = await response.json();
console.log(data.transactions);
```

## Navigation

Added to main navigation bar as "Ledger" link between "Oracle" and "Leaderboard".

## Styling

- Dark theme with slate-900 background
- Color-coded transaction types:
  - Green: Deposits, Bridge In
  - Red: Withdrawals, Bridge Out  
  - Blue: Bridge Out
  - Purple: Bridge In
  - Yellow: Transfers
  - Pink: Settlements

## Future Enhancements

- [ ] Export to CSV
- [ ] Advanced date range filtering
- [ ] Transaction search by hash
- [ ] Pagination for large datasets
- [ ] Real-time WebSocket updates
- [ ] Transaction details modal
- [ ] Amount range filtering
