/**
 * Vantage Financial Intelligence — Transaction Classification Engine
 * Categorizes flows into INCOME, CONSUMPTION, DEBT_SERVICE, WEALTH_BUILDING, TRANSFER, REFUND, ADJUSTMENT
 * Critical principle: Investments (SIP, Mutual Funds, Equity) are WEALTH_BUILDING, NOT ordinary consumption!
 */

import { TransactionClassification } from './models';

export interface ClassificationResult {
  classification: TransactionClassification;
  confidence: number;
  reason: string;
  normalizedCategory: string;
}

export function classifyTransaction(
  categoryRaw: string | null | undefined,
  descriptionRaw: string | null | undefined,
  typeRaw: string | null | undefined,
  amount: number,
  isNegativeAmount: boolean = false
): ClassificationResult {
  const cat = (categoryRaw || '').toLowerCase().trim();
  const desc = (descriptionRaw || '').toLowerCase().trim();
  const rawType = (typeRaw || '').toLowerCase().trim();

  // 1. Check for salary correction / adjustments
  if (desc.includes('correction') || desc.includes('reversal') || cat.includes('adjustment')) {
    return {
      classification: 'ADJUSTMENT',
      confidence: 95,
      reason: 'Description indicates accounting correction or reversal',
      normalizedCategory: 'Adjustment'
    };
  }

  // 2. Check for refunds
  if (desc.includes('refund') || cat.includes('refund')) {
    return {
      classification: 'REFUND',
      confidence: 90,
      reason: 'Refund or merchant return',
      normalizedCategory: 'Refund'
    };
  }

  // 3. Wealth building (Investments, SIPs, Stocks, Mutual Funds)
  if (
    cat.includes('investment') ||
    cat.includes('wealth') ||
    desc.includes('mutual fund') ||
    desc.includes('sip') ||
    desc.includes('equity') ||
    desc.includes('stocks') ||
    desc.includes('shares') ||
    desc.includes('gold purchase') ||
    desc.includes('ppf') ||
    desc.includes('fixed deposit') ||
    desc.includes('etf')
  ) {
    return {
      classification: 'WEALTH_BUILDING',
      confidence: 95,
      reason: 'Capital allocation toward wealth asset generation (SIP/Equity/MF)',
      normalizedCategory: 'Investments'
    };
  }

  // 4. Debt service (Loans, EMI, Credit Card Payments)
  // Notice: Handles cases like T0202 where category is typo "Foods" but description is "Car loan EMI"!
  if (
    cat.includes('debt') ||
    cat.includes('loan') ||
    cat.includes('emi') ||
    desc.includes('emi') ||
    desc.includes('loan') ||
    desc.includes('credit card payment') ||
    desc.includes('card payment') ||
    desc.includes('mortgage')
  ) {
    let subCat = 'Debt Payment';
    if (desc.includes('home loan')) subCat = 'Home Loan EMI';
    else if (desc.includes('car loan')) subCat = 'Car Loan EMI';
    else if (desc.includes('credit card')) subCat = 'Credit Card Payment';

    return {
      classification: 'DEBT_SERVICE',
      confidence: 95,
      reason: 'Debt obligation and credit service',
      normalizedCategory: subCat
    };
  }

  // 5. Income
  if (
    rawType === 'income' ||
    rawType === 'credit' ||
    cat.includes('income') ||
    cat.includes('salary') ||
    desc.includes('salary') ||
    desc.includes('consulting') ||
    desc.includes('dividend') ||
    desc.includes('interest credit')
  ) {
    let normCat = 'Other Income';
    if (cat.includes('salary') || desc.includes('salary')) normCat = 'Salary';
    else if (desc.includes('consulting')) normCat = 'Consulting Income';

    return {
      classification: 'INCOME',
      confidence: 95,
      reason: 'Inflow of compensation or operational earnings',
      normalizedCategory: normCat
    };
  }

  // 6. Transfers
  if (
    cat.includes('transfer') ||
    desc.includes('transfer') ||
    desc.includes('self transfer') ||
    desc.includes('atm withdrawal') ||
    desc.includes('wallet')
  ) {
    return {
      classification: 'TRANSFER',
      confidence: 85,
      reason: 'Internal account liquidity shift',
      normalizedCategory: 'Transfer'
    };
  }

  // 7. Consumption / Living Expenses
  // Handle categories even if missing or typo
  let normalizedCategory = 'General Expense';
  if (cat.includes('food') || desc.includes('groceries') || desc.includes('dining') || desc.includes('supermarket') || desc.includes('delivery')) {
    normalizedCategory = 'Food & Dining';
  } else if (cat.includes('housing') || cat.includes('rent') || desc.includes('rent') || desc.includes('maintenance')) {
    normalizedCategory = 'Housing';
  } else if (cat.includes('transport') || desc.includes('cab') || desc.includes('fuel') || desc.includes('metro') || desc.includes('maintenance')) {
    normalizedCategory = 'Transportation';
  } else if (cat.includes('utilit') || desc.includes('electricity') || desc.includes('internet') || desc.includes('mobile')) {
    normalizedCategory = 'Utilities';
  } else if (cat.includes('insur') || desc.includes('insurance')) {
    normalizedCategory = 'Insurance';
  } else if (cat.includes('shop') || desc.includes('shopping') || desc.includes('clothing') || desc.includes('electronics')) {
    normalizedCategory = 'Shopping';
  } else if (cat.includes('entert') || desc.includes('movie') || desc.includes('streaming') || desc.includes('outing')) {
    normalizedCategory = 'Entertainment';
  } else if (cat.includes('health') || desc.includes('doctor') || desc.includes('pharmacy') || desc.includes('checkup')) {
    normalizedCategory = 'Healthcare';
  } else if (cat.includes('educat') || desc.includes('books') || desc.includes('course') || desc.includes('training')) {
    normalizedCategory = 'Education';
  } else if (cat.includes('travel') || desc.includes('flight') || desc.includes('hotel')) {
    normalizedCategory = 'Travel';
  } else if (cat.includes('personal') || desc.includes('gym') || desc.includes('salon')) {
    normalizedCategory = 'Personal Care';
  } else if (cat.includes('other') || desc.includes('bank charges') || desc.includes('gift')) {
    normalizedCategory = 'Other Expenses';
  }

  return {
    classification: 'CONSUMPTION',
    confidence: 85,
    reason: 'Routine living expense and consumption',
    normalizedCategory
  };
}
