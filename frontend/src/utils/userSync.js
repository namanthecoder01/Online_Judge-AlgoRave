export async function syncUserProfile(token) {
  try {
    const res = await fetch('http://localhost:5000/api/user/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success && data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
      return data.user;
    }
    return null;
  } catch (err) {
    return null;
  }
}