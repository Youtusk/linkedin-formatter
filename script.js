document.addEventListener('DOMContentLoaded', () => {
    const editor = document.getElementById('editor');
    const charCount = document.getElementById('char-count');
    const wordCount = document.getElementById('word-count');
    const limitWarning = document.getElementById('limit-warning');
    
    const btnBold = document.getElementById('btn-bold');
    const btnItalic = document.getElementById('btn-italic');
    const btnUnderline = document.getElementById('btn-underline');
    const btnStrikethrough = document.getElementById('btn-strikethrough');
    const btnClear = document.getElementById('btn-clear');
    const btnCopy = document.getElementById('btn-copy');

    // Dictionnaires de conversion Unicode (Sans-Serif)
    const chars = {
        normal: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
        bold: "𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇𝟬𝟭𝟮𝟯𝟰𝟱𝟲𝟳𝟴𝟵",
        italic: "𝘈𝘉𝘊𝘋𝘌𝘍𝘎𝘏𝘐𝘑𝘒𝘓𝘔𝘕𝘖𝘗𝘘𝘙𝘚𝘛𝘜𝘝𝘞𝘟𝘠𝘡𝘢𝘣𝘤𝘥𝘦𝘧𝘨𝘩𝘪𝘫𝘬𝘭𝘮𝘯𝘰𝘱𝘲𝘳𝘴𝘵𝘶𝘷𝘸𝘹𝘺𝘻0123456789"
    };

    // Convertit une chaîne de caractères normale vers un style Unicode
    function convertText(text, style) {
        let result = '';

        if (style === 'underline') {
            for (const char of text) {
                if (char === '\n' || char === ' ') result += char;
                else result += char + '\u0332';
            }
            return result;
        }

        if (style === 'strikethrough') {
            for (const char of text) {
                if (char === '\n' || char === ' ') result += char;
                else result += char + '\u0336';
            }
            return result;
        }

        for (const char of text) {
            // Si le caractère est déjà dans un format Unicode, on essaie de le ramener à la normale d'abord
            let normalChar = char;
            let index = chars.normal.indexOf(char);
            
            if (index === -1) {
                // Vérifier si c'est déjà en gras
                let boldIndex = Array.from(chars.bold).indexOf(char);
                if (boldIndex !== -1) {
                    normalChar = chars.normal[boldIndex];
                    index = boldIndex;
                }
                
                // Vérifier si c'est déjà en italique
                let italicIndex = Array.from(chars.italic).indexOf(char);
                if (italicIndex !== -1) {
                    normalChar = chars.normal[italicIndex];
                    index = italicIndex;
                }
            }

            if (index !== -1) {
                // Convertir la chaîne en tableau pour gérer les surrogate pairs correctement
                const styleArray = Array.from(chars[style]);
                result += styleArray[index];
            } else {
                result += char; // Garder les espaces, ponctuations, etc.
            }
        }
        return result;
    }

    // Applique le formatage au texte sélectionné
    function formatSelection(style) {
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        
        if (start === end) return; // Rien n'est sélectionné

        const selectedText = editor.value.substring(start, end);
        const formattedText = convertText(selectedText, style);

        // Remplace le texte
        editor.setRangeText(formattedText, start, end, 'select');
        updateCounters();
        
        // Remettre le focus sur l'éditeur
        editor.focus();
    }

    // Mise à jour des compteurs
    function updateCounters() {
        const text = editor.value;
        const length = text.length;
        
        // Compter les mots (séparés par des espaces)
        const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;

        charCount.textContent = `${length} characters`;
        wordCount.textContent = `${words} words`;

        // LinkedIn limite typiquement à 3000 caractères
        if (length > 3000) {
            limitWarning.textContent = "LinkedIn limit exceeded!";
            limitWarning.className = "limits danger";
            charCount.style.color = "var(--danger)";
        } else if (length > 2800) {
            limitWarning.textContent = "Warning, approaching limit";
            limitWarning.className = "limits warning";
            charCount.style.color = "#f59e0b";
        } else {
            limitWarning.textContent = "Ideal for LinkedIn (Max 3000)";
            limitWarning.className = "limits";
            charCount.style.color = "var(--text-muted)";
        }
    }

    // Écouteurs d'événements
    editor.addEventListener('input', updateCounters);

    btnBold.addEventListener('click', () => formatSelection('bold'));
    btnItalic.addEventListener('click', () => formatSelection('italic'));
    btnUnderline.addEventListener('click', () => formatSelection('underline'));
    btnStrikethrough.addEventListener('click', () => formatSelection('strikethrough'));
    
    btnClear.addEventListener('click', () => {
        if (editor.value.length > 0 && confirm('Are you sure you want to clear everything?')) {
            editor.value = '';
            updateCounters();
            editor.focus();
        }
    });

    // Copier le contenu
    btnCopy.addEventListener('click', () => {
        const text = editor.value;
        if (!text) return;

        const successAnim = () => {
            const originalHtml = btnCopy.innerHTML;
            btnCopy.innerHTML = '<i data-lucide="check"></i><span>Copied successfully!</span>';
            btnCopy.classList.add('success');
            lucide.createIcons();

            setTimeout(() => {
                btnCopy.innerHTML = originalHtml;
                btnCopy.classList.remove('success');
                lucide.createIcons();
            }, 2000);
        };

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(successAnim).catch(fallbackCopy);
        } else {
            fallbackCopy();
        }

        function fallbackCopy() {
            editor.select();
            try {
                document.execCommand('copy');
                successAnim();
            } catch (err) {
                console.error('Erreur de copie:', err);
                alert("Auto-copy blocked by browser. Please use Ctrl+C.");
            }
            window.getSelection().removeAllRanges();
            editor.focus();
        }
    });

    // Raccourcis clavier (Ctrl+B, Ctrl+I)
    editor.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'b' || e.key === 'B') {
                e.preventDefault();
                formatSelection('bold');
            } else if (e.key === 'i' || e.key === 'I') {
                e.preventDefault();
                formatSelection('italic');
            } else if (e.key === 'u' || e.key === 'U') {
                e.preventDefault();
                formatSelection('underline');
            }
        }
    });

    // Init compteurs
    updateCounters();
});
