import { Octokit } from "https://esm.sh/@octokit/rest";

function parseData(data) {
      if (Array.isArray(data)) {
        return data
      }
  
    if (!data) {
      return []
    }
  

    delete data.incomplete_results;
    delete data.repository_selection;
    delete data.total_count;
 
    const namespaceKey = Object.keys(data)[0];
    data = data[namespaceKey];
  
    return data;
  }


function displayUserInfo(user){
    

    const userImg = document.getElementById('user-img');
    const userName = document.getElementById('user-name');
    const userBio = document.getElementById('user-bio');
    const userUrl = document.getElementById('user-url');
    const userEmail = document.getElementById('user-email');
    const userLocation = document.getElementById('user-loc');

    userImg.src = user.avatar_url;
    userName.textContent = user.name;
    userBio.textContent = user.bio || 'No bio available.';
    userUrl.href = user.html_url;
    userUrl.textContent = user.html_url;

    
    
    if (user.email) {
        
        const envelopeIcon = document.createElement('i');
        envelopeIcon.className = 'fa fa-envelope';
        
        
        userEmail.appendChild(envelopeIcon);
        
        
        userEmail.appendChild(document.createTextNode(' '));
    
        
        userEmail.appendChild(document.createTextNode(user.email));
    }

    if (user.location) {
        
        const mapIcon = document.createElement('i');
        mapIcon.className = 'fa fa-map-marker';
        mapIcon.style='font-size:24px'
        
        userLocation.appendChild(mapIcon);
        
        
        userLocation.appendChild(document.createTextNode(' '));
    
        
        userLocation.appendChild(document.createTextNode(user.location));
    }
}


function displayRepositories(repositories) {
    const repositoriesContainer = document.getElementById('repositories');
    const repoTitle = document.getElementById('repoT');
    repoTitle.innerHTML = '<h2>Repositories</h2>';

    repositories.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    repositories.forEach(repo => {
        const repoElement = document.createElement('div');
        repoElement.classList.add('repo-card');


        repoElement.innerHTML = `
            <h3>${repo.name}</h3>
            <p>${repo.description || 'No description available'}</p>
            <div>
                <h4>Languages:</h4>
            </div>
        `;

        const languagesUrl = repo.languages_url;
        fetch(languagesUrl)
        .then(response => response.json())
        .then(languageData => {
            const languagesContainer = repoElement.querySelector('div');
            let languageCount = 0;

            
            for (const [language, value] of Object.entries(languageData)) {
                if (languageCount < 3) {
                    
                    const languageDiv = document.createElement('div');
                    languageDiv.innerHTML = `
                        <div class="language">
                            <p class="language-name">${language}</p>
                        </div>
                    `;
                    languagesContainer.appendChild(languageDiv);
                    languageCount++;
                } else {
                    break;
                }
            }
        })
        .catch(error => {
            console.error('Error fetching language data:', error);
        });
        repositoriesContainer.appendChild(repoElement);
    });
}

function filterRepositories(searchTerm) {
    
    if (searchTerm.trim() === '') {
        displayRepositories(allRepositories);
        return;
    }

    const filteredRepositories = allRepositories.filter(repo => {
        
        const nameMatch = repo.name.toLowerCase().includes(searchTerm.toLowerCase());
        const languageMatch = repo.language.toLowerCase().includes(searchTerm.toLowerCase());

        return nameMatch || languageMatch;
    });

    displayRepositories(filteredRepositories);
}


async function getPaginatedData(username, perPage) {
    const nextPattern = /(?<=<)([\S]*)(?=>; rel="Next")/i;
    let pagesRemaining = true;

    const octokit = new Octokit({
        auth: window.config.apiKey,
      });
     
    let url = `/users/${username}/repos`;

    while (pagesRemaining) {
      const response = await octokit.request(`GET ${url}`, {
        per_page: perPage,
        headers: {
          "X-GitHub-Api-Version":
            "2022-11-28",
        },
      });
  
      const parsedData = parseData(response.data);
      displayRepositories(parsedData);
  
      const linkHeader = response.headers.link;
  
      pagesRemaining = linkHeader && linkHeader.includes(`rel=\"next\"`);
  
      if (pagesRemaining) {
        url = linkHeader.match(nextPattern)[0];
      }
    }
  }
  
document.getElementById('githubForm').addEventListener('submit', async function(event){
    event.preventDefault();

    const username = document.getElementById('username').value;
    const perPage = document.getElementById('quantity').value;

    const Container = document.getElementById('container');
    Container.style.display = 'none';

    const loaderElement = document.getElementById('loader');
    loaderElement.style.display = 'block';
     
    console.log('GitHub Username:', username);
    console.log('Repositories Per Page:', perPage);

    const octokit = new Octokit({
        auth: window.config.apiKey,
      })
     
     try{ 
      const user = await octokit.request('GET /users/{username}', {
        username: username,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });

      getPaginatedData(username, perPage);

      displayUserInfo(user.data);
    }catch(err){
        console.log(err);
    }finally{
        loaderElement.style.display = 'none';
    }
});

