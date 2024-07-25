document.addEventListener('DOMContentLoaded', function() {
    // Daftar whitelist pengguna
    const whitelist = {
        'ikanmas': 'User1',
        'lelegoreng': 'User2',
        'dendengsapi': 'User3',
        'lanciao': 'User4',
        'tuyuljelek': 'User5'
    };

    let currentUser = null;
    let convertedFilesCount = 0;
    let downloadedFilesCount = 0;

    // Fungsi untuk mencatat aktivitas ke log
    function logActivity(action, details) {
        console.log(`[${new Date().toISOString()}] User: ${currentUser}, Action: ${action}, Details: ${details}`);
    }

    // Fungsi login
    document.getElementById('loginButton').addEventListener('click', function() {
        const keywordInput = document.getElementById('keywordInput');
        const loginMessage = document.getElementById('loginMessage');
        const loginSection = document.getElementById('loginSection');
        const convertSection = document.getElementById('convertSection');
        const splitSection = document.getElementById('splitSection');
        const mergeSection = document.getElementById('mergeSection');
        const convertVcfToTxtSection = document.getElementById('convertVcfToTxtSection');
        
        const keyword = keywordInput.value.trim();
        
        if (whitelist[keyword]) {
            currentUser = whitelist[keyword];
            loginSection.style.display = 'none';
            convertSection.style.display = 'block';
            splitSection.style.display = 'block';
            mergeSection.style.display = 'block';
            convertVcfToTxtSection.style.display = 'block';
            loginMessage.textContent = 'Login berhasil! Selamat datang, ' + currentUser + '.';
        } else {
            loginMessage.textContent = 'Keyword tidak valid!';
        }
    });

    // Fungsi untuk menghitung kontak dalam textarea
    function countContacts(text) {
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        return lines.length;
    }

    // Hitung kontak
    document.getElementById('convertCountButton').addEventListener('click', function() {
        const text = document.getElementById('fileContent').value.trim();

        if (!text) {
            alert('Isi textarea tidak boleh kosong!');
            return;
        }

        const contactCount = countContacts(text);
        document.getElementById('convertContactCount').value = `Jumlah kontak: ${contactCount}`;
        logActivity('Hitung Kontak', `Jumlah kontak: ${contactCount}`);
    });

    // Konversi TXT ke VCF
    document.getElementById('convertButton').addEventListener('click', function() {
        const text = document.getElementById('fileContent').value.trim();
        const fileName = document.getElementById('convertFileNameInput').value.trim() || 'output';
        const contactName = document.getElementById('contactNameInput').value.trim() || 'contact';

        if (!text) {
            alert('Isi textarea tidak boleh kosong!');
            return;
        }

        function ensurePlusSign(number) {
            return number.startsWith('+') ? number : `+${number}`;
        }

        const lines = text.split('\n').map(line => ensurePlusSign(line.trim()));
        const contactCount = lines.length;

        const vcfContent = lines.map((line, index) => 
`BEGIN:VCARD
VERSION:3.0
FN:${contactName}_${index + 1}
TEL:${line}
END:VCARD`
        ).join('\n');

        const blob = new Blob([vcfContent], { type: 'text/vcf' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.vcf`;
        document.body.appendChild(a);
        a.click();

        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        document.getElementById('convertContactCount').value = `Jumlah kontak: ${contactCount}`;
        convertedFilesCount++;
        logActivity('Konversi File', `Nama file: ${fileName}.vcf, Jumlah kontak: ${contactCount}`);
    });

    // Fungsi untuk memecah file VCF
    document.getElementById('splitButton').addEventListener('click', function() {
        const fileInput = document.getElementById('vcfFileInput');
        const contactsPerFile = parseInt(document.getElementById('contactsPerFile').value.trim(), 10);
        const fileName = document.getElementById('splitFileNameInput').value.trim() || 'output';

        if (fileInput.files.length === 0 || isNaN(contactsPerFile) || contactsPerFile <= 0) {
            alert('Mohon pilih file dan masukkan jumlah kontak per file yang valid!');
            return;
        }

        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const content = e.target.result;
            const contacts = content.split('END:VCARD').filter(card => card.trim() !== '').map(card => card + 'END:VCARD');
            const totalContacts = contacts.length;

            let partNumber = 1;
            for (let i = 0; i < totalContacts; i += contactsPerFile) {
                const partContacts = contacts.slice(i, i + contactsPerFile).join('');
                const blob = new Blob([partContacts], { type: 'text/vcf' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${fileName}_part${partNumber}.vcf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                partNumber++;
            }

            document.getElementById('splitContactCount').value = `Jumlah kontak: ${totalContacts}`;
            logActivity('Pecah VCF', `Nama file: ${fileName}, Jumlah kontak: ${totalContacts}`);
        };

        reader.readAsText(file);
    });

    // Gabungkan file teks
    document.getElementById('mergeButton').addEventListener('click', function() {
        const fileInput = document.getElementById('txtFilesInput');
        const mergedFileName = document.getElementById('mergedFileNameInput').value.trim() || 'merged';

        if (fileInput.files.length === 0) {
            alert('Mohon pilih file teks yang ingin digabungkan!');
            return;
        }

        const files = Array.from(fileInput.files);
        let combinedContent = '';

        files.forEach((file, index) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                combinedContent += e.target.result + '\n';
                
                if (index === files.length - 1) {
                    const blob = new Blob([combinedContent], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${mergedFileName}.txt`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);

                    logActivity('Gabungkan File Teks', `Nama file: ${mergedFileName}.txt`);
                }
            };

            reader.readAsText(file);
        });
    });

    // Konversi VCF ke TXT
    document.getElementById('convertVcfToTxtButton').addEventListener('click', function() {
        const fileInput = document.getElementById('vcfToTxtFileInput');

        if (fileInput.files.length === 0) {
            alert('Mohon pilih file VCF yang ingin dikonversi!');
            return;
        }

        const file = fileInput.files[0];
        const reader = new FileReader();

        reader.onload = function(e) {
            const content = e.target.result;
            const lines = content.split('END:VCARD').filter(card => card.trim() !== '').map(card => card.split('\n')[1].split(':')[1].trim());
            const txtContent = lines.join('\n');
            const blob = new Blob([txtContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'converted.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            document.getElementById('txtFileContent').value = txtContent;
            downloadedFilesCount++;
            logActivity('Konversi VCF ke TXT', `Nama file: converted.txt`);
        };

        reader.readAsText(file);
    });
});
