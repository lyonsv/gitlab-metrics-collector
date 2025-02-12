import { demoData } from './data.js';
import { exportToHtml } from '../exporters/html.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function generateDemo() {
    console.log('Generating demo visualization...');
    
    try {
        const outputPath = path.join(__dirname, '../../demo.html');
        await exportToHtml(demoData, outputPath);
        console.log(`Demo visualization generated successfully at: ${outputPath}`);
        console.log('\nDemo data includes:');
        console.log('- 5 team members with different performance levels');
        console.log('- 12 months of data (Jan 2023 - Dec 2023)');
        console.log('- Varying MR counts to demonstrate performance bands');
        console.log('\nTry different views:');
        console.log('- Individual View: Compare specific team members');
        console.log('- Team Average: See overall team performance');
        console.log('- View All: Compare everyone at once');
        console.log('- Performance Bands: Identify high and low performers');
    } catch (error) {
        console.error('Failed to generate demo:', error.message);
        process.exit(1);
    }
}

generateDemo(); 