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

const projects = sqliteTable('projects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  status: text('status').default('active'),
  color: text('color').default('#6366f1'),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`)
})

const tasks = sqliteTable('tasks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  project_id: integer('project_id').references(() => projects.id),
  title: text('title').notNull(),
  description: text('description'),
  assigned_to: text('assigned_to'),
  status: text('status').default('todo'),
  priority: text('priority').default('medium'),
  theme: text('theme'),
  tag: text('tag').default('home'),
  due_date: text('due_date'),
  completed_at: text('completed_at'),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`)
})

const subtasks = sqliteTable('subtasks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  task_id: integer('task_id').references(() => tasks.id).notNull(),
  title: text('title').notNull(),
  is_complete: integer('is_complete').default(0),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`)
})

const comments = sqliteTable('comments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  task_id: integer('task_id').references(() => tasks.id).notNull(),
  author: text('author').notNull(),
  body: text('body').notNull(),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`)
})

const mealPlans = sqliteTable('meal_plans', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  week_start: text('week_start').notNull(),
  meals: text('meals').notNull(),
  grocery_list: text('grocery_list'),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`)
})

module.exports = { accounts, categories, transactions, projects, tasks, subtasks, comments, mealPlans }
