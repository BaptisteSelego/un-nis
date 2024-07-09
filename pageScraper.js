const scraperObject = {
    url: 'https://www.unis-immo.fr/particuliers/qui-sommes-nous/annuaire-des-professionnels?Addr_Ville=&Addr_CP=&Nom%20Site%20RaisonSociale=&Site_CONTACTPrincipal::Nom=&Add_Metier=METIER_TR&&Page=1',
    async scraper(browser) {
        let page = await browser.newPage();
        console.log(`Navigating to ${this.url}...`);
        await page.goto(this.url);
        await new Promise(resolve => setTimeout(resolve, 2000));
            console.log('Waiting for 2 seconds');
       ;

        
        // Définir la fonction scrapePage
            // Wait for the elements containing the data to be visible
            const scrapePage = async (pageNumber) => {
            const url = `https://www.unis-immo.fr/particuliers/qui-sommes-nous/annuaire-des-professionnels?Addr_Ville=&Addr_CP=&Nom%20Site%20RaisonSociale=&Site_CONTACTPrincipal::Nom=&Add_Metier=METIER_TR&&Page=${pageNumber}`;
                
                // Aller à l'URL spécifique
            await page.goto(url);
            const dataSelector = '.list-group';
            await page.waitForSelector(dataSelector, { visible: true });
            console.log('Target elements are visible');
            await new Promise(resolve => setTimeout(resolve, 2000));
            console.log('Waiting for 2 seconds before scrolling');
            // Scraper la page
            const data = await page.evaluate(() => {
                // Sélectionner tous les éléments avec la classe .NcCmA
                const containerElements = document.querySelectorAll('.list-item.views-row');

                // Convertir la NodeList en tableau et mapper chaque élément
                return Array.from(containerElements).map(container => {
                    // Sélectionner le titre dans .sc-bXCLTC.vm8xc2-0.cVbuZq à l'intérieur de chaque conteneur
                    const titleElement = container.querySelector('.views-row .views-field-field-site-name');
                    const title = titleElement ? titleElement.innerText : 'N/A';

                    const firstnameElement = container.querySelector('.views-field-field-user-firstname');
                    const firstname = firstnameElement ? firstnameElement.innerText : 'N/A';

                    const nameElement = container.querySelector('.views-field-field-user-lastname');
                    const name = nameElement ? nameElement.innerText : 'N/A';
                    
                   
                    const fullName = `${firstname} ${name}`;

                    // Sélectionner l'entreprise dans .geXsAH à l'intérieur de chaque conteneur
                    const adresse1Container = container.querySelector('.views-field.views-field-field-site-addr-rue1');
                    const adresse1Element = adresse1Container ? adresse1Container.querySelector('.field-content') : null;
                    const adresse1 = adresse1Element ? adresse1Element.innerText : 'N/A';

                     // Sélectionner l'adresse dans .views-field views-field-field-site-addr-cp .field-content à l'intérieur de chaque conteneur
                     const adresse2Container = container.querySelector('.views-field.views-field-field-site-addr-cp');
                     const adresse2Element = adresse2Container ? adresse2Container.querySelector('.field-content') : null;
                     const adresse2 = adresse2Element ? adresse2Element.innerText : 'N/A';
                     
                     const adresse3Container = container.querySelector('.views-field.views-field-field-site-addr-ville');
                     const adresse3Element = adresse3Container ? adresse3Container.querySelector('.field-content') : null;
                     const adresse3 = adresse3Element ? adresse3Element.innerText : 'N/A';
 
                    const adresse = `${adresse1} ${adresse2} ${adresse3}`;

                    const numContainer = container.querySelector('.views-field.views-field-field-societe-mobile');
                    const numElement = numContainer ? numContainer.querySelector('.field-content') : null;
                    const num = numElement ? numElement.innerText : 'N/A';

                    const linkContainer = container.querySelector('.views-field.views-field-field-societe-website');
const linkElement = linkContainer ? linkContainer.querySelector('.field-content a') : null; // Assurez-vous que cette ligne cible un élément <a>
const link = linkElement ? linkElement.href : 'N/A';

                    // Retourner un objet avec le titre et l'entreprise
                    return {
                        title: title,
                        fullName: fullName,
                        adresse: adresse,
                        link: link,
                        numero_de_tel: num,
                    };
                });
            });

            for (const item of data) {
                if (item.link !== 'N/A') {
                    console.log(`Opening new tab for ${item.link}`);
                    try {
                        const newPage = await browser.newPage();
                        await newPage.goto(item.link, { waitUntil: 'networkidle2' });

                        const email = await newPage.evaluate(() => {
                            new Promise(resolve => setTimeout(resolve, 2000));
                            // Utiliser une expression régulière pour trouver les adresses e-mail
                            const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
                            const bodyText = document.body.innerText;
                            const allEmails = bodyText.match(emailPattern) || [];
                            // Retourner les adresses e-mail trouvées
                            return allEmails.join(', ');
                        });

                        // Ajouter les e-mails à l'objet item
                        item.email = email;
                        await newPage.close();
                    } catch (error) {
                        console.error(`Failed to open ${item.link}: ${error.message}`);
                        item.email = 'NA';
                    }
                } else {
                    item.email = 'NA';
                }

                // Vérifier si l'email est null et définir à 'NA'
                if (!item.email) {
                    item.email = 'NA';
                }
            }


            return data;
        };

        // Appeler la fonction scrapePage
        const scrapedData = [];
        for (let pageNumber = 1; pageNumber <= 76; pageNumber++) {
            console.log(`Scrapping page ${pageNumber}...`);
            const pageData = await scrapePage(pageNumber);
            scrapedData.push(pageData);
        }
        scrapedData.sort((a, b) => {
            if (a.email !== 'N/A' && b.email === 'N/A') {
                return -1;  // a avant b
            } else if (a.email === 'N/A' && b.email !== 'N/A') {
                return 1;  // b avant a
            }
            return 0;  // a et b sont égaux en termes de présence de l'email, les laisser dans leur ordre original
        });

        // Retourner les données extraites
        return scrapedData;
    }
};

module.exports = scraperObject;
