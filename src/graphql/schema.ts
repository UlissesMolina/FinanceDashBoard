export const typeDefs = `
  type Transaction {
    id: ID!
    description: String!
    amount: Float!
    type: String!
    category: String!
    date: String!
    createdAt: String!
    notes: String
  }

  type CategorySummary {
    category: String!
    total: Float!
    count: Int!
  }

  type DailyBalance {
    date: String!
    balance: Float!
    income: Float!
    expense: Float!
  }

  type OverviewMetrics {
    totalIncome: Float!
    totalExpense: Float!
    netAmount: Float!
    transactionCount: Int!
  }

  input AddTransactionInput {
    description: String!
    amount: Float!
    type: String!
    category: String!
    date: String!
  }

  enum TimePeriod {
    WEEK
    MONTH
    QUARTER
    YEAR
  }

  type Query {
    transactions(limit: Int): [Transaction!]!
    transactionsByMonth(year: Int!, month: Int!, period: TimePeriod): [Transaction!]!
    overviewMetrics(year: Int!, month: Int!, period: TimePeriod): OverviewMetrics!
    spendingByCategory(year: Int!, month: Int!, period: TimePeriod): [CategorySummary!]!
    dailyBalances(year: Int!, month: Int!, period: TimePeriod): [DailyBalance!]!
  }

  input UpdateTransactionInput {
    id: ID!
    category: String
    notes: String
  }

  type Mutation {
    addTransaction(input: AddTransactionInput!): Transaction!
    updateTransaction(input: UpdateTransactionInput!): Transaction!
  }
`;
