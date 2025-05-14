
        document.addEventListener('DOMContentLoaded', () => {
            // DOM Elements
            const searchBtn = document.getElementById('searchBtn');
            const usernameInput = document.getElementById('username');
            const profileContainer = document.getElementById('profileContainer');
            const loading = document.getElementById('loading');
            const error = document.getElementById('error');
            const errorMessage = document.getElementById('errorMessage');
            const tryAgainBtn = document.getElementById('tryAgainBtn');
            const calendar = document.getElementById('calendar');
            
            // Initialize GitHub Calendar
            GitHubCalendar("#calendar", "", { responsive: true, tooltips: true, global_stats: false });
            
            // Format date
            const formatDate = (dateString) => {
                const options = { year: 'numeric', month: 'long', day: 'numeric' };
                return new Date(dateString).toLocaleDateString(undefined, options);
            };
            
            // Fetch GitHub profile
            const fetchProfile = async (username) => {
                try {
                    // Show loading state
                    profileContainer.classList.add('hidden');
                    error.classList.add('hidden');
                    loading.classList.remove('hidden');
                    
                    // Add slight delay for animation
                    await new Promise(resolve => setTimeout(resolve, 300));
                    
                    // Fetch profile data
                    const profileResponse = await fetch(`https://api.github.com/users/${username}`);
                    
                    if (!profileResponse.ok) {
                        throw new Error(profileResponse.status === 404 
                            ? 'User not found. Please check the username and try again.' 
                            : 'Failed to fetch profile. GitHub API might be rate limiting requests.');
                    }
                    
                    const profileData = await profileResponse.json();
                    
                    // Fetch repositories
                    const reposResponse = await fetch(profileData.repos_url + '?per_page=100&sort=updated');
                    if (!reposResponse.ok) throw new Error('Failed to fetch repositories');
                    const reposData = await reposResponse.json();
                    
                    // Update calendar with the new username
                    GitHubCalendar("#calendar", username, { responsive: true, tooltips: true, global_stats: false });
                    
                    // Display profile with animation
                    setTimeout(() => {
                        displayProfile(profileData, reposData);
                        profileContainer.classList.remove('hidden');
                        profileContainer.classList.remove('opacity-0');
                    }, 100);
                    
                } catch (err) {
                    showError(err.message);
                }
            };
            
            // Display profile
            const displayProfile = (profile, repos) => {
                loading.classList.add('hidden');
                error.classList.add('hidden');
                
                // Set profile data
                document.getElementById('avatar').src = profile.avatar_url || 'https://via.placeholder.com/150';
                document.getElementById('name').textContent = profile.name || profile.login;
                document.getElementById('login').textContent = `@${profile.login}`;
                document.getElementById('bio').textContent = profile.bio || 'This user has no bio.';
                document.getElementById('location').textContent = profile.location || 'Not specified';
                document.getElementById('blog').textContent = profile.blog ? (profile.blog.length > 30 ? profile.blog.substring(0, 30) + '...' : profile.blog) : 'Not specified';
                document.getElementById('blog').href = profile.blog || '#';
                document.getElementById('company').textContent = profile.company || 'Not specified';
                document.getElementById('joined').textContent = `Joined ${formatDate(profile.created_at)}`;
                document.getElementById('repos').textContent = profile.public_repos;
                document.getElementById('followers').textContent = profile.followers;
                document.getElementById('following').textContent = profile.following;
                
                // Set view profile button
                document.getElementById('viewProfileBtn').onclick = () => {
                    window.open(profile.html_url, '_blank');
                };
                
                // Set badges
                const badges = document.getElementById('badges');
                badges.innerHTML = '';
                
                if (profile.hireable) {
                    badges.innerHTML += '<span class="px-3 py-1.5 rounded-full text-xs bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 text-emerald-300 border border-emerald-500/30">Hireable</span>';
                }
                if (profile.type === 'Organization') {
                    badges.innerHTML += '<span class="px-3 py-1.5 rounded-full text-xs bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-300 border border-blue-500/30">Organization</span>';
                }
                if (profile.twitter_username) {
                    badges.innerHTML += `<a href="https://twitter.com/${profile.twitter_username}" target="_blank" class="px-3 py-1.5 rounded-full text-xs bg-gradient-to-r from-sky-500/20 to-sky-600/20 text-sky-300 border border-sky-500/30 hover:bg-sky-500/30 transition">
                        <i class="fab fa-twitter mr-1"></i> @${profile.twitter_username}
                    </a>`;
                }
                
                // Display repositories
                displayRepositories(repos);
                
                // Display language chart
                displayLanguageChart(repos);
            };
            
            // Display repositories
            const displayRepositories = (repos) => {
                const reposContainer = document.getElementById('reposContainer');
                reposContainer.innerHTML = '';
                
                // Filter out forks and sort by stars
                const sortedRepos = [...repos]
                    .filter(repo => !repo.fork) // Exclude forked repositories
                    .sort((a, b) => b.stargazers_count - a.stargazers_count);
                
                // Display top 5 repos (or all if less than 5)
                const reposToShow = sortedRepos.slice(0, 5);
                
                if (reposToShow.length === 0) {
                    reposContainer.innerHTML = `
                        <div class="col-span-full text-center py-8 text-white/60">
                            <i class="fas fa-code-branch text-4xl mb-4"></i>
                            <p>No public repositories found</p>
                        </div>
                    `;
                    return;
                }
                
                reposToShow.forEach((repo, index) => {
                    const repoCard = document.createElement('div');
                    repoCard.className = 'backdrop-blur-sm bg-white/5 rounded-xl p-5 border border-white/10 hover:border-white/20 transition-all duration-500 transform hover:-translate-y-2 hover:shadow-lg hover:shadow-purple-500/10';
                    repoCard.style.animation = `slide-up 0.5s ease-out ${index * 0.1}s forwards`;
                    repoCard.style.opacity = '0';
                    
                    const updatedDate = new Date(repo.updated_at);
                    const formattedDate = updatedDate.toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                    });
                    
                    repoCard.innerHTML = `
                        <div class="flex justify-between items-start mb-4">
                            <h3 class="font-bold text-lg truncate">
                                <a href="${repo.html_url}" target="_blank" class="hover:text-purple-300 transition">${repo.name}</a>
                            </h3>
                            <div class="flex items-center space-x-3">
                                ${repo.stargazers_count > 0 ? `
                                    <span class="flex items-center text-sm bg-white/10 px-2.5 py-1 rounded-lg">
                                        <i class="fas fa-star mr-1.5 text-yellow-300"></i> ${repo.stargazers_count.toLocaleString()}
                                    </span>
                                ` : ''}
                                ${repo.forks_count > 0 ? `
                                    <span class="flex items-center text-sm bg-white/10 px-2.5 py-1 rounded-lg">
                                        <i class="fas fa-code-branch mr-1.5 text-purple-300"></i> ${repo.forks_count.toLocaleString()}
                                    </span>
                                ` : ''}
                            </div>
                        </div>
                        <p class="text-white/80 mb-5 line-clamp-2">${repo.description || 'No description provided'}</p>
                        <div class="flex flex-wrap gap-2 text-xs mb-4">
                            ${repo.language ? `<span class="bg-white/10 px-3 py-1.5 rounded-lg flex items-center">
                                <span class="w-2 h-2 rounded-full mr-2" style="background-color: ${getLanguageColor(repo.language)}"></span>
                                ${repo.language}
                            </span>` : ''}
                            ${repo.license ? `<span class="bg-white/10 px-3 py-1.5 rounded-lg">${repo.license.spdx_id || repo.license.name}</span>` : ''}
                        </div>
                        <div class="text-xs text-white/60 flex items-center">
                            <i class="fas fa-clock mr-1.5"></i> Updated on ${formattedDate}
                        </div>
                    `;
                    reposContainer.appendChild(repoCard);
                });
            };
            
            // Display language chart
            const displayLanguageChart = (repos) => {
                const languageChart = document.getElementById('languageChart');
                const languageLabels = document.getElementById('languageLabels');
                languageChart.innerHTML = '';
                languageLabels.innerHTML = '';
                
                // Calculate language bytes (approximate with repo count)
                const languageStats = {};
                let totalRepos = 0;
                
                repos.forEach(repo => {
                    if (repo.language) {
                        languageStats[repo.language] = (languageStats[repo.language] || 0) + 1;
                        totalRepos += 1;
                    }
                });
                
                // Sort languages by frequency
                const sortedLanguages = Object.entries(languageStats)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5); // Show top 5 languages
                
                // Create chart bars
                sortedLanguages.forEach(([language, count]) => {
                    const percentage = (count / totalRepos) * 100;
                    const color = getLanguageColor(language);
                    
                    const bar = document.createElement('div');
                    bar.className = 'h-full transition-all duration-500';
                    bar.style.width = `${percentage}%`;
                    bar.style.backgroundColor = color;
                    bar.style.opacity = '0';
                    setTimeout(() => {
                        bar.style.opacity = '1';
                    }, 100);
                    
                    languageChart.appendChild(bar);
                });
                
                // Create labels
                sortedLanguages.forEach(([language, count]) => {
                    const percentage = (count / totalRepos) * 100;
                    const color = getLanguageColor(language);
                    
                    const label = document.createElement('div');
                    label.className = 'flex items-center';
                    label.innerHTML = `
                        <span class="w-3 h-3 rounded-full mr-2" style="background-color: ${color}"></span>
                        <span class="font-medium">${language}</span>
                        <span class="text-white/60 ml-2">${Math.round(percentage)}%</span>
                    `;
                    languageLabels.appendChild(label);
                });
                
                // If no languages found
                if (sortedLanguages.length === 0) {
                    languageLabels.innerHTML = `
                        <div class="text-white/60">
                            No language data available
                        </div>
                    `;
                }
            };
            
            // Get color for programming language
            const getLanguageColor = (language) => {
                const colors = {
                    'JavaScript': '#f1e05a',
                    'Python': '#3572A5',
                    'Java': '#b07219',
                    'TypeScript': '#3178c6',
                    'C++': '#f34b7d',
                    'C': '#555555',
                    'C#': '#178600',
                    'PHP': '#4F5D95',
                    'Ruby': '#701516',
                    'Go': '#00ADD8',
                    'Swift': '#ffac45',
                    'Kotlin': '#A97BFF',
                    'Rust': '#dea584',
                    'Shell': '#89e051',
                    'HTML': '#e34c26',
                    'CSS': '#563d7c',
                    'SCSS': '#c6538c',
                    'Vue': '#41b883',
                    'Dart': '#00B4AB',
                    'Elixir': '#6e4a7e',
                    'Clojure': '#db5855',
                    'R': '#198CE7',
                    'Scala': '#c22d40',
                    'Haskell': '#5e5086',
                    'Lua': '#000080',
                    'Perl': '#0298c3',
                    'PowerShell': '#012456',
                    'TeX': '#3D6117'
                };
                
                return colors[language] || '#8b5cf6';
            };
            
            // Show error
            const showError = (message) => {
                loading.classList.add('hidden');
                profileContainer.classList.add('hidden');
                errorMessage.textContent = message;
                error.classList.remove('hidden');
            };
            
            // Event listeners
            searchBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const username = usernameInput.value.trim();
                if (username) {
                    fetchProfile(username);
                } else {
                    showError('Please enter a GitHub username to search.');
                }
            });
            
            usernameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    searchBtn.click();
                }
            });
            
            tryAgainBtn.addEventListener('click', () => {
                const username = usernameInput.value.trim();
                if (username) {
                    fetchProfile(username);
                }
            });
            
            // Focus the input on page load
            usernameInput.focus();
        });
