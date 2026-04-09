document.addEventListener('DOMContentLoaded', async () => {
    
    const postForm = document.getElementById('post-form');
    const feedList = document.getElementById('feed-list');

    if (!postForm || !feedList) return;

    // Check auth
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return; // Prevent errors if unauthenticated

    let currentProfile = null;

    // Fetch user profile info
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
    
    if (profile) currentProfile = profile;

    // --- Load Feed ---
    async function loadFeed() {
        try {
            // Join posts with profiles
            const { data: posts, error } = await supabase
                .from('posts')
                .select(`
                    id,
                    image_url,
                    caption,
                    created_at,
                    profiles (
                        full_name,
                        avatar_url
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            feedList.innerHTML = '';
            
            if (!posts || posts.length === 0) {
                feedList.innerHTML = '<p class="text-center" style="color: var(--text-muted-gray);">No posts yet. Be the first to share something!</p>';
                return;
            }

            posts.forEach(post => {
                const author = post.profiles?.full_name || 'Anonymous User';
                const avatar = post.profiles?.avatar_url || 'https://via.placeholder.com/40/1D3557/FFFFFF?text=U';
                const timeStr = new Date(post.created_at).toLocaleString();

                const postEl = document.createElement('div');
                postEl.className = 'post-card animate-on-scroll is-visible'; // Auto visible since loaded dynamically
                
                postEl.innerHTML = `
                    <div class="post-header">
                        <img src="${avatar}" alt="Avatar" class="post-avatar">
                        <div>
                            <div class="post-author">${author}</div>
                            <div class="post-time">${timeStr}</div>
                        </div>
                    </div>
                    <img src="${post.image_url}" alt="Post image" class="post-image">
                    <div class="post-body">
                        <p class="post-caption"><strong>${author}</strong> ${post.caption || ''}</p>
                    </div>
                `;
                
                feedList.appendChild(postEl);
            });

        } catch (err) {
            console.error('Error loading feed:', err);
            feedList.innerHTML = '<p class="text-center text-primary">Failed to load feed.</p>';
        }
    }

    // --- Upload Post ---
    postForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const imageFile = document.getElementById('post-image').files[0];
        const caption = document.getElementById('post-caption').value;
        const btn = document.getElementById('post-submit-btn');
        const errorDiv = document.getElementById('post-error');

        if (!imageFile) return;

        btn.disabled = true;
        btn.innerText = 'Uploading...';
        errorDiv.style.display = 'none';

        try {
            // 1. Upload to storage
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${user.id}_${Math.random()}.${fileExt}`;
            const filePath = `public/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('posts')
                .upload(filePath, imageFile);
            
            if (uploadError) throw uploadError;

            // Get URL
            const { data: { publicUrl } } = supabase.storage.from('posts').getPublicUrl(filePath);

            // 2. Insert into DB
            const { error: insertError } = await supabase
                .from('posts')
                .insert([{
                    user_id: user.id,
                    image_url: publicUrl,
                    caption: caption
                }]);

            if (insertError) throw insertError;

            // Clear form & reload feed
            postForm.reset();
            loadFeed();

        } catch (err) {
            console.error(err);
            errorDiv.innerText = err.message || 'Failed to upload post.';
            errorDiv.style.display = 'block';
        } finally {
            btn.disabled = false;
            btn.innerText = 'Post to Feed';
        }
    });

    // Initial load
    loadFeed();
});
