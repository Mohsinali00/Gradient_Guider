import SerialCounter from '../models/SerialCounter.model.js';

/**
 * @param {string} companyCode
 * @param {string} firstName
 * @param {string} lastName 
 * @param {number} yearOfJoining 
 * @param {ObjectId} companyId 
 * @returns {Promise<string>} 
 */
export async function generateLoginId(companyCode, firstName, lastName, yearOfJoining, companyId) {
  
  // Use company code (first two letters of company name) instead of hardcoded "OI"
  const companyPrefix = companyCode.toUpperCase();
  

  const firstNamePrefix = firstName.substring(0, 2).toUpperCase();
  const lastNamePrefix = lastName.substring(0, 2).toUpperCase();
  
 
  const serialCounter = await SerialCounter.findOneAndUpdate(
    { companyId, year: yearOfJoining },
    { $inc: { currentSerial: 1 } },
    { 
      upsert: true, 
      new: true,
      setDefaultsOnInsert: true
    }
  );

  const serial = String(serialCounter.currentSerial).padStart(4, '0');
  

  const loginId = `${companyPrefix}${firstNamePrefix}${lastNamePrefix}${yearOfJoining}${serial}`;
  
  return loginId;
}

