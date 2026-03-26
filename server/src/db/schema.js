const { sqliteTable, integer, text, real } = require('drizzle-orm/sqlite-core')
const { sql } = require('drizzle-orm')

const accounts = sqliteTable('accounts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  type: text('type').notNull(),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`)
})

const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  type: text('type').notNull(),
  color: text('color')
})

const transactions = sqliteTable('transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  account_id: integer('account_id').references(() => accounts.id),
  category_id: integer('category_id').references(() => categories.id),
  amount: real('amount').notNull(),
  type: text('type').notNull(),
  description: text('description'),
  date: text('date').notNull(),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`)
})

const tasks = sqliteTable('tasks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  assigned_to: text('assigned_to'),
  status: text('status').default('todo'),
  due_date: text('due_date'),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`)
})

const mealPlans = sqliteTable('meal_plans', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  week_start: text('week_start').notNull(),
  meals: text('meals').notNull(),
  grocery_list: text('grocery_list'),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`)
})

module.exports = { accounts, categories, transactions, tasks, mealPlans }
