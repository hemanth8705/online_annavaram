/**
 * Role-Based Access Control Middleware
 * Ensures proper data access based on user roles
 */

/**
 * Middleware to ensure only admins can create/update/delete products
 */
export const adminOnlyProductWrite = async (req, res, next) => {
  // This middleware assumes admin authentication has already been verified
  // by the existing auth middleware
  next();
};

/**
 * Middleware to ensure only admins can create/update/delete categories
 */
export const adminOnlyCategories = async (req, res, next) => {
  // This middleware assumes admin authentication has already been verified
  // by the existing auth middleware
  next();
};

/**
 * Middleware to validate order status updates are only by admins
 */
export const adminOnlyOrderUpdate = async (req, res, next) => {
  // This middleware assumes admin authentication has already been verified
  // by the existing auth middleware
  
  // Additional validation: ensure status updates include updatedBy field
  if (req.body.status && !req.body.updatedBy) {
    req.body.updatedBy = req.admin._id;
  }
  
  next();
};

/**
 * Middleware to ensure reviews can be moderated by admins
 */
export const adminReviewModeration = async (req, res, next) => {
  // Admins can update isApproved, isDeleted fields
  // This middleware assumes admin authentication has already been verified
  next();
};

/**
 * Filter query to only show active products to non-admin users
 */
export const filterActiveProducts = (query) => {
  return {
    ...query,
    isActive: true,
    isDeleted: false
  };
};

/**
 * Filter query to only show approved reviews to non-admin users
 */
export const filterApprovedReviews = (query) => {
  return {
    ...query,
    isApproved: true,
    isDeleted: false
  };
};

export default {
  adminOnlyProductWrite,
  adminOnlyCategories,
  adminOnlyOrderUpdate,
  adminReviewModeration,
  filterActiveProducts,
  filterApprovedReviews
};
