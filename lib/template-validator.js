/* eslint complexity:off */
'use strict';
const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const _ = require('lodash');
const ajv = new Ajv({
	useDefaults: true,
});

/**
 * Reads the schema for the given template.
 * @param {string} templateDirectory the absolute path to the template
 * @param {string} schemaName the schema file name e.g. 'pattern.json'
 * @returns {Object} an json-schema-4 object
 */
function getSchema(templateDirectory, schemaName) {
	const schemaFile = path.join(templateDirectory, schemaName);
	const schemaContent = fs.readFileSync(schemaFile);

	let parsedSchema;
	try {
		parsedSchema = JSON.parse(schemaContent);
	} catch (e) {
		e.message = `Failed to parse ${schemaFile} ${e.message}`;
		throw (e);
	}
	if (!parsedSchema.properties) {
		throw new Error(`Schema ${schemaFile} is missing a property definition`);
	}
	const requiredProperties = _.uniq((parsedSchema.required || []).concat(
		Object.keys(parsedSchema.properties)
			.filter((property) => !property.default)
	));
	const schema = {
		$schema: 'http://json-schema.org/draft-04/schema#',
		title: parsedSchema.name,
		properties: parsedSchema.properties,
		type: 'object',
		required: requiredProperties,
	};
	if (schema.required.length === 0) {
		delete(schema.required);
	}
	if (!ajv.validateSchema(schema)) {
		throw new Error(`Error in ${schemaFile}: "${ajv.errorsText()}"`);
	}
	return schema;
}

/**
 * Validate the component
 * @param {Object} componentRenderData - the render data which will be passed to hbs
 * @param {Object} componentInformation - the component information and configuration
 * @returns {boolean} isValid
 */
function validate(componentRenderData, componentInformation) {
	if (!ajv.validate(componentInformation.templateSchema, componentRenderData)) {
		throw new Error(ajv.errorsText());
	}
	return true;
}

module.exports = {
	getSchema,
	validate,
};
