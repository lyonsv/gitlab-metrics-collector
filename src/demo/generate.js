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
        console.log('- 5 team members');
        console.log('- 12 months of data (Jan 2023 - Dec 2023)');
        console.log('- Interactive visualizations with team average overlay');
        console.log('\nTry different views:');
        console.log('- Individual View: Compare specific team members (with optional team average overlay)');
        console.log('- Team Average: See overall team performance');
        console.log('- View All: Compare everyone at once');
    } catch (error) {
        console.error('Failed to generate demo:', error.message);
        process.exit(1);
    }
}

generateDemo(); 