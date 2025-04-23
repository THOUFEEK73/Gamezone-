export const createUser = async (tempUser) => {
    try {
      const { name, email, phone, password } = tempUser;
      
      // Create a new user and hash the password before saving it to the database
      const newUser = new User({
        name,
        email,
        phone,
        password, // The hashed password is already in tempUser
        isrsVerified: true,
      });
  
      await newUser.save();
      return newUser;
    } catch (err) {
      console.error("Error creating user:", err);
      return null;
    }
  };
  