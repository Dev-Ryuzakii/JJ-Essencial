# Bank Accounts Public Endpoint Solution

## Problem
The current bank accounts endpoint (`GET /api/admin/settings/bank-accounts`) requires authentication, but customers need access to bank account details during checkout for manual bank transfers.

## Solution
Add a public endpoint to the payments controller for customers to access bank account information during checkout.

## Implementation

### 1. Add Public Bank Accounts Endpoint to Payments Controller

Add this endpoint to `/src/modules/payments/payments.controller.ts`:

```typescript
@Get('bank-accounts')
@ApiOperation({ summary: 'Get bank accounts for manual transfers (Public)' })
@ApiResponse({ 
  status: 200, 
  description: 'Bank accounts retrieved successfully',
  type: SuccessResponseDto
})
async getPublicBankAccounts(): Promise<SuccessResponseDto<any>> {
  const bankAccounts = await this.paymentsService.getPublicBankAccounts();
  return new SuccessResponseDto(bankAccounts, 'Bank accounts retrieved successfully');
}
```

### 2. Add Service Method to Payments Service

Add this method to `/src/modules/payments/payments.service.ts`:

```typescript
async getPublicBankAccounts() {
  // You can either:
  // Option 1: Call the admin service directly
  return await this.adminService.getBankAccounts();
  
  // Option 2: Create a separate method that only returns public-safe data
  const bankAccounts = await this.adminService.getBankAccounts();
  return bankAccounts.map(account => ({
    id: account.id,
    bank_name: account.bank_name,
    account_name: account.account_name,
    account_number: account.account_number,
    // Exclude any sensitive information like internal notes
  }));
}
```

### 3. Inject AdminService in PaymentsService

Make sure AdminService is injected in the PaymentsService constructor:

```typescript
constructor(
  private readonly supabase: SupabaseClient,
  private readonly adminService: AdminService, // Add this if not already present
) {}
```

### 4. Updated Frontend Integration

With the public endpoint, update your React components to use the new URL:

```typescript
// BankAccountSelector Component - Updated
const BankAccountSelector: React.FC<BankAccountSelectorProps> = ({ 
  onSelect, 
  selectedAccountId 
}) => {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchBankAccounts();
  }, []);

  const fetchBankAccounts = async () => {
    try {
      setLoading(true);
      // Updated endpoint - now public, no auth needed
      const response = await fetch('/api/payments/bank-accounts');
      
      if (!response.ok) {
        throw new Error('Failed to fetch bank accounts');
      }

      const data = await response.json();
      setBankAccounts(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bank accounts');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse">Loading bank accounts...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">{error}</p>
        <button 
          onClick={fetchBankAccounts}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (bankAccounts.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <p className="text-yellow-800">No bank accounts available for transfers.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium">Select Bank Account</h3>
      {bankAccounts.map((account) => (
        <div
          key={account.id}
          className={`border rounded-lg p-4 cursor-pointer transition-colors ${
            selectedAccountId === account.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => onSelect(account)}
        >
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium">{account.bank_name}</h4>
              <p className="text-sm text-gray-600">{account.account_name}</p>
              <p className="text-sm font-mono">{account.account_number}</p>
            </div>
            {selectedAccountId === account.id && (
              <CheckCircleIcon className="h-5 w-5 text-blue-500" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
```

## API Endpoints Summary

### Public Endpoints (No Authentication Required)
- `GET /api/payments/bank-accounts` - Get bank accounts for customer checkout

### Authenticated Endpoints (Require JWT Token)
- `POST /api/payments/bank-transfer/initiate` - Initiate bank transfer payment
- `POST /api/payments/receipt/upload` - Upload payment receipt

### Admin Endpoints (Require Admin Role)
- `GET /api/admin/settings/bank-accounts` - Admin bank account management
- `POST /api/admin/settings/bank-accounts` - Add new bank account
- `GET /api/payments/receipts/pending` - View pending receipt verifications
- `PATCH /api/payments/receipt/:receiptId/verify` - Verify payment receipts

## Security Considerations

1. **Public Data Only**: The public endpoint should only return customer-safe information (bank name, account name, account number)
2. **No Sensitive Data**: Exclude internal notes, admin comments, or configuration details
3. **Rate Limiting**: Consider adding rate limiting to prevent abuse
4. **CORS**: Ensure proper CORS configuration for frontend access

## Testing the New Endpoint

Test the public endpoint:

```bash
curl -X GET "http://localhost:3000/api/payments/bank-accounts" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "bank_name": "First Bank",
      "account_name": "JJ Essential Store",
      "account_number": "1234567890"
    }
  ],
  "message": "Bank accounts retrieved successfully"
}
```

## Implementation Steps

1. Add the public endpoint to `PaymentsController`
2. Add the service method to `PaymentsService`
3. Ensure `AdminService` is properly injected
4. Update frontend components to use the new public endpoint
5. Test the implementation
6. Update your existing documentation to reflect the new endpoint

This solution provides secure public access to bank account information while maintaining proper authentication for payment operations and admin functions.
