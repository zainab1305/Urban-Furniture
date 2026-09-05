import { app } from './app.js';
import { env } from './config/env.js';
import { ensureDefaultAccounts } from './config/db.js';

app.listen(env.port, '0.0.0.0', () => {
	console.log(`Urban Furniture API listening on port ${env.port}`);
	ensureDefaultAccounts()
		.then(() => console.log('Default chart of accounts ready.'))
		.catch(error => console.error('Default chart of accounts could not be initialized:', error.message));
});
