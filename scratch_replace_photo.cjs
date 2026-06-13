const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.jsx') || file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.js')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('d:/Program Files/Eddva/eddva_frontend/src');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Replace usages of .photo with .profileImage
    content = content.replace(/user\?\.photo/g, 'user?.profileImage');
    content = content.replace(/user\.photo/g, 'user.profileImage');
    content = content.replace(/student\.photo/g, 'student.profileImage');
    content = content.replace(/teacher\.photo/g, 'teacher.profileImage');
    content = content.replace(/s\.photo/g, 's.profileImage');
    content = content.replace(/r\.photo/g, 'r.profileImage');
    content = content.replace(/row\.photo/g, 'row.profileImage');
    content = content.replace(/sender_photo/g, 'sender_photo'); // leave as is if we changed it in backend, wait backend uses sender_photo AS sender_photo?
    content = content.replace(/formData\.photo/g, 'formData.profileImage');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated: ${file}`);
    }
});
