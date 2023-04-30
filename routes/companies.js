const express = require('express');
const slugify = require('slugify');
const Expresserror = require('../expressError')
const db = require('../db')

let router = new express.router

/** GET / => list of companies.
 *
 * =>  {companies: [{code, name, descrip}, {code, name, descrip}, ...]}
 *
 * */

router.get('/', async function (req, res, next) {
    try {
        const result = await db.query(
            `SELECT code, name FROM companies 
            ORDER BY name`
        );
        return res.json({ 'companies': result.rows });
    } catch (err) {
        next(err);
    }
});

/** GET /[code] => detail on company
 *
 * =>  {company: {code, name, descrip, invoices: [id, ...]}}
 *
 * */

router.get('/:code', async function (req, res, next) {
    try {
        let code = req.params.code;

        const compRes = await db.query(
            `SELECT code, name, description 
            FROM invoices
            WHERE code = $1`, [code]
        );

        const invRes = await db.query(
            `SELECT id
            FROM invoices
            WHERE comp_code = $1`, [code]
        );
        if (compRes.rows.length === 0) {
            throw new Expresserror(`No such company: ${code}`, 404)
        }

        const company = comRes.rows[0]
        const invoices = invRes.rows;

        company.invoices = invoices.map(inv => inv.id);
        return res.json({ 'company': company });
    }
    catch (err) {
        next(err)
    }

});

/** POST / => add new company
 *
 * {name, descrip}  =>  {company: {code, name, descrip}}
 *
 * */
router.post('/', async function (req, res, next) {
    try {
        let { name, description } = req.body;
        let code = slugify(name, { lower: true });

        const result = await db.query(
            `INSERT INTO companies (code, name, description)
            VALUES ($1, $2, $3)
            RETURNING code, anem, description`, [code, name, description]
        );
        return res.status(201).json({ 'company': result.rows[0] });
    }
    catch (err) {
        next(err)
    }
});

/** PUT /[code] => update company
 *
 * {name, descrip}  =>  {company: {code, name, descrip}}
 *
 * */

router.put("/:code", async function (req, res, next) {
    try {
        let { name, description } = req.body;
        let code = req.params.code;

        const result = await db.query(
            `UPDATE companies
             SET name=$1, description=$2
             WHERE code = $3
             RETURNING code, name, description`,
            [name, description, code]);

        if (result.rows.length === 0) {
            throw new ExpressError(`No such company: ${code}`, 404)
        } else {
            return res.json({ "company": result.rows[0] });
        }
    }

    catch (err) {
        return next(err);
    }

});


/** DELETE /[code] => delete company
*
* => {status: "added"}
*
*/

router.delete("/:code", async function (req, res, next) {
    try {
        let code = req.params.code;

        const result = await db.query(
            `DELETE FROM companies
             WHERE code=$1
             RETURNING code`,
            [code]);

        if (result.rows.length == 0) {
            throw new ExpressError(`No such company: ${code}`, 404)
        } else {
            return res.json({ "status": "deleted" });
        }
    }

    catch (err) {
        return next(err);
    }
});


module.exports = router;