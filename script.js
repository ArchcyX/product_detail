emailjs.init({ publicKey: "D2qHDLv2La9LTIzPO" });

// Sayfa tamamen yüklendiğinde formları ve eventleri başlat
document.addEventListener('DOMContentLoaded', function() {
    const planningForm = document.getElementById('planningForm');
    
    // Tüm radio butonlarına change event listener ekle
    const allRadioButtons = document.querySelectorAll('input[type="radio"]');
    allRadioButtons.forEach(radio => {
        radio.addEventListener('change', updateProgress);
    });
    
    if (planningForm) {
        // Form submit event listener
        planningForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Form verilerini topla
            const formData = {};
            const questions = document.querySelectorAll('input[type="radio"]:checked');
            
            // Form doğrulama - en az bir seçenek seçilmiş olmalı
            if (questions.length === 0) {
                alert('Lütfen en az bir soruyu cevaplayın.');
                return false;
            }
            
            questions.forEach(question => {
                const name = question.getAttribute('name');
                const value = question.value;
                formData[name] = value;
            });
            
            // E-posta adresi alanı (varsa)
            const emailInput = document.getElementById('contactEmail');
            if (emailInput) {
                formData.email = emailInput.value;
            }
            
            // Tarih ve saat bilgisini ekle
            formData.submissionDate = new Date().toISOString();
            
            console.log("Form verileri toplanıyor:", formData);
            
            // Verileri şifrele ve mail gönder
            encryptAndEmailData(formData);
            
            // Modal göster
            showModal();
        });
    } else {
        console.error("Form elementi bulunamadı: #planningForm");
    }
    
    // İlerleme çubuğunu başlat
    updateProgress();
});

/**
 * Form verilerini XOR+Base64 ile şifreler, sonra EmailJS ile gönderir.
 */
function encryptAndEmailData(formData) {
    try {
        // 1) Anahtar oluştur
        const encryptionKey = Math.random().toString(36).substring(2, 15)
            + Math.random().toString(36).substring(2, 15);
        
        // 2) JSON string
        const jsonData = JSON.stringify(formData);
        
        // 3) XOR şifreleme
        function encryptXOR(text, key) {
            let result = '';
            for (let i = 0; i < text.length; i++) {
                const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
                result += String.fromCharCode(charCode);
            }
            return result;
        }
        const encryptedData = encryptXOR(jsonData, encryptionKey);
        
        // 4) Base64
        function utf8ToBase64(str) {
            return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, 
                (match, p1) => String.fromCharCode('0x' + p1)));
        }
        const base64Data = utf8ToBase64(encryptedData);
        
        // 5) EmailJS parametreleri
        const emailParams = {
            to_email: 'goktuguum@gmail.com',
            subject: 'Yeni Form Gönderimi',
            message: JSON.stringify({ data: base64Data, key: encryptionKey, timestamp: new Date().toISOString() }, null, 2)
        };
        
        // 6) EmailJS ile gönder (serviceID, templateID, parametreler)
        emailjs.send('service_et5gufy', 'template_a8hon4h', emailParams)
            .then(response => console.log('Mail gönderildi', response.status, response.text))
            .catch(err => console.error('Mail gönderim hatası', err));
        
    } catch (error) {
        console.error("Veri şifreleme ve mail gönderme hatası:", error);
        alert("Veriler gönderilirken bir hata oluştu: " + error.message);
    }
}

// Modal gösterme fonksiyonu
function showModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.style.display = 'block';
        
        // Modal kapatma butonu işlevi
        const closeBtn = modal.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.onclick = function() {
                modal.style.display = 'none';
            };
        }
        
        // Modal dışına tıklayınca da kapansın
        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        };
    } else {
        alert('Form başarıyla gönderildi ve verileriniz indirildi!');
    }
}

// Modalı kapatma fonksiyonu
function closeModal() {
    const modalContent = document.querySelector('.modal-content');
    if (modalContent) {
        modalContent.classList.remove('show-modal');
        
        setTimeout(function() {
            const modal = document.getElementById('successModal');
            if (modal) {
                modal.style.display = "none";
            }
        }, 300);
    }
}

// İlerleme çubuğunu güncelleme fonksiyonu
function updateProgress() {
    // Toplam soru sayısını form elemanlarına göre hesapla
    const formQuestionGroups = document.querySelectorAll('input[type="radio"]');
    const questionNames = new Set();
    formQuestionGroups.forEach(input => {
        questionNames.add(input.name);
    });
    
    const totalQuestions = questionNames.size;
    
    // Cevaplanmış benzersiz soru sayısını bul
    const answeredNames = new Set();
    document.querySelectorAll('input[type="radio"]:checked').forEach(input => {
        answeredNames.add(input.name);
    });
    const answeredQuestions = answeredNames.size;
    
    // Yüzdeyi hesapla
    const percentage = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
    
    const completedQuestionsEl = document.getElementById('completedQuestions');
    const completionPercentageEl = document.getElementById('completionPercentage');
    const progressBarEl = document.getElementById('progressBar');
    
    if (completedQuestionsEl) {
        completedQuestionsEl.textContent = answeredQuestions;
    }
    
    if (completionPercentageEl) {
        completionPercentageEl.textContent = percentage + '%';
    }
    
    if (progressBarEl) {
        progressBarEl.style.width = percentage + '%';
    }
    
    console.log(`İlerleme: ${answeredQuestions}/${totalQuestions} soru (${percentage}%)`);
}