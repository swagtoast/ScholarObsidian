document.getElementById("extractBtn").addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: extractAndDownload
  });
});

function extractAndDownload() {
  // --- 1. SELEZIONE DATI ---
  // Titolo articolo
  const titleEl = document.querySelector('.gsc_hdb_cit_tl');
  // Autore (Prendiamo il primo elemento meta che contiene gli autori)
  const authorEl = document.querySelector('.gsc_hdb_cit_meta');

  if (!titleEl) {
    alert("ERRORE: Non trovo le evidenziazioni. Assicurati di aver aperto il pannello laterale 'Evidenziazioni' su Scholar.");
    return;
  }

  let title = titleEl.innerText.trim();
  // Se non trova l'autore, mette "Unknown"
  let authors = authorEl ? authorEl.innerText.trim() : "Unknown";

  // --- 2. PULIZIA NOME FILE ---
  // Sostituisce i due punti con punto e gli slash con trattino
  let safeTitle = title.replace(/:/g, '.').replace(/\//g, '-');
  let safeAuthors = authors.replace(/:/g, '.').replace(/\//g, '-');
  
  // Nome file finale: [Autori]. [Titolo].md
  let filename = `${safeAuthors}. ${safeTitle}.md`;

  // --- 3. COSTRUZIONE CONTENUTO MARKDOWN ---
  let contentMarkdown = "";
  
  // Aggiungiamo metadati in cima (opzionale, stile Obsidian)
  contentMarkdown += `# ${title}\n`;
  contentMarkdown += `**Autori:** ${authors}\n\n`;
  contentMarkdown += `---\n\n`;

  // Cerchiamo tutti i blocchi evidenziati
  const highlights = document.querySelectorAll('.gsc_hdb_hl');

  highlights.forEach(block => {
    // A. PAGINA (Header 2)
    const pageEl = block.querySelector('.gsc_hdb_pn');
    if (pageEl) {
      // innerText pulisce automaticamente l'icona SVG, lasciando solo "Pagina X"
      contentMarkdown += `## ${pageEl.innerText.trim()}\n\n`;
    }

    // B. TESTO EVIDENZIATO (Blockquote)
    const textEl = block.querySelector('.gsc_hdb_hl_text');
    if (textEl) {
      contentMarkdown += `> ${textEl.innerText.trim()}\n\n`;
    }

    // C. ANNOTAZIONE TUA (Header 3)
    const noteWrapper = block.querySelector('.gsc_hdb_hl_comment');
    if (noteWrapper) {
       // Cerchiamo il DIV dentro il commento per evitare l'icona della matita
       const divInside = noteWrapper.querySelector('div');
       // Se c'è un div interno prendiamo quello, altrimenti tutto il testo
       const noteText = divInside ? divInside.innerText : noteWrapper.innerText;
       
       contentMarkdown += `### Annotation:\n${noteText.trim()}\n\n`;
    }
  });

  // --- 4. AVVIO DOWNLOAD ---
  const blob = new Blob([contentMarkdown], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}