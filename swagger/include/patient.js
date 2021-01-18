
/**
 * @swagger
 * resourcePath: /Patient
 * description: All about API
 */

/**
 * @swagger
 * path: /api/patient
 * operations:
 *   -  httpMethod: POST
 *      summary: Create Patient Api
 *      notes: Returns a patient detail
 *      responseClass: Patient
 *      nickname: patient
 *      consumes: 
 *        - text/html
 *      parameters:
 *        - name: body
 *          description: Patient detail
 *          paramType: body
 *          required: true
 *          dataType: body
 */

/**
 * @swagger
 * models:
 *   Patient:
 *     id: Patient
 *     properties:
 *       first_name:
 *         type: String
 *       middle_name:
 *         type: String 
 *       last_name:
 *         type: String
 *       email:
 *         type: String  
 *       gender:
 *         type: String
 *       date_of_birth:
 *         type: String   
 *       cell_number_country:
 *         type: integer
 *       cell_number:
 *         type: integer 
 *       cell_number_country_code:
 *         type: integer
 *       work_number_country:
 *         type: integer  
 *       work_number_country_code:
 *         type: integer
 *       work_number:
 *         type: integer  
 *       address_line1:
 *         type: string  
 *       address_line2:
 *         type: string
 *       country:
 *         type: string  
 *       state:
 *         type: string
 *       city:
 *         type: string  
 *       zip_code:
 *         type: string  
 *       body_height:
 *         type: string
 *       weight:
 *         type: string  
 */