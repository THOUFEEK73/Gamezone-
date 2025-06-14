

export const getSalesReportPage = async (req, res) => {
    try{

        res.render('admin/salesReport')

    }catch(error) {
        console.error(error);
        res.status(500).render('error', { message: 'Server error loading sales report' });
    }
}