router.get('/users', (req, res) => {
    res.render('admin/users', {
        currentPage: 'users-list',
        users: [] // Your users data
    });
})