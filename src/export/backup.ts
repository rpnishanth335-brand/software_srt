import { saveAs } from 'file-saver';
import { Project } from '../types';

/**
 * Download complete project state as a .chronoforge.json backup file.
 */
export function exportProjectBackup(project: Project): void {
  const jsonString = JSON.stringify(project, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const filename = `${project.school.name}_Project_Backup.chronoforge.json`.replace(/\s+/g, '_');
  saveAs(blob, filename);
}

/**
 * Parse an imported .chronoforge.json file and return the Project object.
 */
export async function importProjectBackup(file: File): Promise<Project> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text) as Project;

        // Basic schema verification
        if (!parsed.id || !parsed.school || !Array.isArray(parsed.classes)) {
          throw new Error('Invalid ChronoForge project file structure.');
        }

        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsText(file);
  });
}
