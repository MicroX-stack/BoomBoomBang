// ==========================================
// Preload All Game Assets (Final Screen, HP Cats, Questions)
// ==========================================
function preloadAllGameImages() {
    const finalAssets = [
        'end/win1.png',
        'end/win2.png',
        'end/cry1.png',
        'end/cry2.png',
        'end/cry3.png',
        'end/winner-jukebox-bg-removed.png',
        'end/Lose.png'
    ];
    
    const bloodAssets = [
        'blood/cat1.png', 
        'blood/cat2.png'
    ];
    
    const questionAssets = [];
    for (const cat in categoryQuestions) {
        for (const level in categoryQuestions[cat]) {
            categoryQuestions[cat][level].forEach(q => {
                if (q.image) questionAssets.push(q.image);
            });
        }
    }
    
    const allAssets = [...finalAssets, ...bloodAssets, ...questionAssets];
    
    const preloadContainer = document.createElement('div');
    preloadContainer.style.display = 'none';
    preloadContainer.id = 'preload-container';
    document.body.appendChild(preloadContainer);
    
    allAssets.forEach(src => {
        const img = document.createElement('img');
        img.src = src;
        preloadContainer.appendChild(img);
    });
}
preloadAllGameImages();
