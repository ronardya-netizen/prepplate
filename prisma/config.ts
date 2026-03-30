import { defineConfig } from 'prisma/config'

export default defineConfig({
  datasource: {
    url: "postgresql://postgres.xntnjamehgqoqwcknhjf:TiChef20262@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1",
  },
})
