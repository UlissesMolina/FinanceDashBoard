import { gql } from '@apollo/client';

export const GET_TRANSACTIONS = gql`
  query GetTransactions($limit: Int) {
    transactions(limit: $limit) {
      id
      description
      amount
      type
      category
      date
      createdAt
    }
  }
`;

export const GET_TRANSACTIONS_BY_MONTH = gql`
  query GetTransactionsByMonth($year: Int!, $month: Int!, $period: TimePeriod) {
    transactionsByMonth(year: $year, month: $month, period: $period) {
      id
      description
      amount
      type
      category
      date
      createdAt
      notes
    }
  }
`;

export const UPDATE_TRANSACTION = gql`
  mutation UpdateTransaction($input: UpdateTransactionInput!) {
    updateTransaction(input: $input) {
      id
      description
      amount
      type
      category
      date
      createdAt
      notes
    }
  }
`;

export const GET_OVERVIEW_METRICS = gql`
  query GetOverviewMetrics($year: Int!, $month: Int!, $period: TimePeriod) {
    overviewMetrics(year: $year, month: $month, period: $period) {
      totalIncome
      totalExpense
      netAmount
      transactionCount
    }
  }
`;

export const GET_SPENDING_BY_CATEGORY = gql`
  query GetSpendingByCategory($year: Int!, $month: Int!, $period: TimePeriod) {
    spendingByCategory(year: $year, month: $month, period: $period) {
      category
      total
      count
    }
  }
`;

export const GET_DAILY_BALANCES = gql`
  query GetDailyBalances($year: Int!, $month: Int!, $period: TimePeriod) {
    dailyBalances(year: $year, month: $month, period: $period) {
      date
      balance
      income
      expense
    }
  }
`;

export const ADD_TRANSACTION = gql`
  mutation AddTransaction($input: AddTransactionInput!) {
    addTransaction(input: $input) {
      id
      description
      amount
      type
      category
      date
      createdAt
    }
  }
`;
