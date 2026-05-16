Environment Variables

Manage sensitive data securely across environments.

Default secrets#
Edge Functions have access to these secrets by default:

SUPABASE_URL: The API gateway for your Supabase project
SUPABASE_DB_URL: The URL for your Postgres database. You can use this to connect directly to your database
SUPABASE_PUBLISHABLE_KEYS: The publishable keys JSON dictionary for your Supabase API. This is safe to use in a browser when you have Row Level Security enabled
SUPABASE_SECRET_KEYS: The secret keys JSON dictionary for your Supabase API. This is safe to use in Edge Functions, but it should NEVER be used in a browser. This key will bypass Row Level Security
SUPABASE_JWKS: The JSON Web Key Set used to verify user JWTs. Same value served at https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json
Legacy keys:

SUPABASE_ANON_KEY: The anon key for your Supabase API. This is safe to use in a browser when you have Row Level Security enabled
SUPABASE_SERVICE_ROLE_KEY: The service_role key for your Supabase API. This is safe to use in Edge Functions, but it should NEVER be used in a browser. This key will bypass Row Level Security
In a hosted environment, functions have access to the following environment variables:

SB*REGION: The region function was invoked
SB_EXECUTION_ID: A UUID of function instance (isolate)
DENO_DEPLOYMENT_ID: Version of the function code ({project_ref}*{function*id}*{version})
Accessing environment variables#
You can access environment variables using Deno's built-in handler, and passing it the name of the environment variable you’d like to access.

Deno.env.get('NAME_OF_SECRET')
For example, in a function:

import { createClient } from 'npm:@supabase/supabase-js@2'
const SUPABASE_PUBLISHABLE_KEYS = JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS')!)
// For user-facing operations (respects RLS)
const supabase = createClient(
Deno.env.get('SUPABASE_URL')!,
// If you want to use a different api key, change 'default' to your preferred key name
SUPABASE_PUBLISHABLE_KEYS['default']
)
const SUPABASE_SECRET_KEYS = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')!)
// For admin operations (bypasses RLS)
const supabaseAdmin = createClient(
Deno.env.get('SUPABASE_URL')!,
// If you want to use a different api key, change 'default' to your preferred key name
SUPABASE_SECRET_KEYS['default']
)
Local secrets#
In development, you can load environment variables in two ways:

Through an .env file placed at supabase/functions/.env, which is automatically loaded on supabase start
Through the --env-file option for supabase functions serve. This allows you to use custom file names like .env.local to distinguish between different environments.
supabase functions serve --env-file .env.local
Never check your .env files into Git! Instead, add the path to this file to your .gitignore.

We can automatically access the secrets in our Edge Functions through Deno’s handler

const secretKey = Deno.env.get('STRIPE_SECRET_KEY')
Now we can invoke our function locally. If you're using the default .env file at supabase/functions/.env, it's automatically loaded:

supabase functions serve hello-world
Or you can specify a custom .env file with the --env-file flag:

supabase functions serve hello-world --env-file .env.local
This is useful for managing different environments (development, staging, etc.).

Production secrets#
You will also need to set secrets for your production Edge Functions. You can do this via the Dashboard or using the CLI.

Using the Dashboard:

Visit Edge Function Secrets Management page in your Dashboard.
Add the Key and Value for your secret and press Save
Edge Functions Secrets Management
Note that you can paste multiple secrets at a time.

Using the CLI

You can create a .env file to help deploy your secrets to production

# .env

STRIPE*SECRET_KEY=sk_live*...
Never check your .env files into Git! Instead, add the path to this file to your .gitignore.

You can push all the secrets from the .env file to your remote project using supabase secrets set. This makes the environment visible in the dashboard as well.

supabase secrets set --env-file .env
Alternatively, this command also allows you to set production secrets individually rather than storing them in a .env file.

supabase secrets set STRIPE*SECRET_KEY=sk_live*...
To see all the secrets which you have set remotely, you can use supabase secrets list

supabase secrets list
You don't need to re-deploy after setting your secrets. They're available immediately in your
functions.
