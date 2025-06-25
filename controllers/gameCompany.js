import gamecompany from '../models/gamecompany.js';


export const getCompanyPage = async(req,res) =>{
    try{
        const companies = await gamecompany.find();
        return res.render('admin/gameCompany',{company:companies});
    }catch(error){

    }
}

export const addGameCompany = async(req,res) =>{
    try{
         console.log('triggered here')
        const {companyName} = req.body;
      
       
        if(!companyName || companyName.trim()===""){
            req.flash('error','Company name is requried');
            return res.redirect('/admin/company');
        }
        
        await gamecompany.create({name:companyName});

        req.flash('success','Company added successfully');
        res.redirect('/admin/company');
    }catch(error){

        console.error('Error adding game company:',error);
        req.flash('error','An error occurred while adding the company');
        res.redirect('/admin/company');

    }
}

export const editCompany = async(req,res)=>{
    try{
      const {id} = req.params;
      const {companyName} = req.body;
   

      if(!companyName && companyName.trim()===''){
        req.flash('error','Company name is required');
        return res.redirect('/admin/companies');
      }
         console.log('triggered here')
      await gamecompany.findByIdAndUpdate(id,{name:companyName});
      console.log('issues')
      res.redirect('/admin/company')
    }catch(error){

    }
}



export const toggleCompanyStatus = async(req,res) =>{
    console.log('triggered')
        try{
            const {id}  = req.params;
            const company = await gamecompany.findById(id);
            
            if(!company){
                req.flash('error','Company not found');
                return res.redirect('/admin/company');
            }
             const newStatus = company.status === 'active'?'inactive':'active';
              await gamecompany.updateOne({_id:id},{status:newStatus})
              
              return res.redirect('/admin/company')

        }catch(err){

        }
}