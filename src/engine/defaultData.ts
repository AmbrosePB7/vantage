/**
 * Vantage Financial Intelligence — Default Dataset & Test Format Fixtures
 * Stores default challenge dataset and alternative format fixtures for schema normalization tests.
 */

export const DEFAULT_ASSETS_CSV = `asset_id,type,value,as_of_date
A001,Savings Account,325000,2026-10-01
A002,Current Account,85000,2026-10-01
A003,Fixed Deposit,450000,2026-10-01
A004,Mutual Funds,625000,2026-10-01
A005,Equity Portfolio,410000,2026-10-01
A006,Gold,280000,2026-10-01
A007,Vehicle,650000,2026-10-01
A008,Property,4200000,2026-10-01`;

export const DEFAULT_LIABILITIES_CSV = `liability_id,type,outstanding,interest_rate,emi,due_date
L001,Home Loan,2850000,8.35,28500,2026-10-10
L002,Car Loan,420000,9.1,11200,2026-10-07
L003,Credit Card,68000,32.0,7000,2026-10-05`;

// Alternative CSV format test fixture 1: West Coast Bank with Debit / Credit columns
export const SAMPLE_DEBIT_CREDIT_TRANSACTIONS = `Date,Particulars,Debit,Credit
2026-08-01,Monthly Payroll,,245000.00
2026-08-03,Apartment Lease,35000.00,
2026-08-05,Supermarket Groceries,6200.50,
2026-08-07,Mortgage Installment,28500.00,
2026-08-10,Equity SIP Transfer,25000.00,
2026-08-15,Electric Utility,3800.00,
2026-08-20,Consulting Retainer,,25000.00
2026-09-01,Monthly Payroll,,245000.00
2026-09-03,Apartment Lease,35000.00,
2026-09-07,Mortgage Installment,28500.00,
2026-09-10,Equity SIP Transfer,25000.00,
2026-09-12,Dining Out,4200.00,
2026-09-22,Credit Card Settlement,8500.00,`;

// Alternative CSV format test fixture 2: Merchant & Value format
export const SAMPLE_MERCHANT_VALUE_TRANSACTIONS = `txn_id,transaction_date,merchant,transaction_value,flow
TX_01,2026-07-02,Employer Corp,235000,income
TX_02,2026-07-04,Residential Landlord,32000,expense
TX_03,2026-07-07,HDFC Home Loan,28500,expense
TX_04,2026-07-10,Zerodha AMC SIP,20000,expense
TX_05,2026-07-15,Metro Supermarket,5400,expense
TX_06,2026-08-02,Employer Corp,238000,income
TX_07,2026-08-04,Residential Landlord,32000,expense
TX_08,2026-08-07,HDFC Home Loan,28500,expense
TX_09,2026-08-10,Zerodha AMC SIP,20000,expense`;
