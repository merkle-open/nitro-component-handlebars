/* eslint-disable prefer-rest-params */
'use strict';
const assert = require('assert');
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const hbs = require('hbs');
// local lib
const TemplateResolver = require('./lib/template-resolver.js');
const TemplateValidator = require('./lib/template-validator.js');

/**
 * Configuration of the component handlebars helper
 *
 * @param {Object} userConfig configuration
 * @returns {function} the configured helper
 */
function ComponentHandlebarsHelper(userConfig) {
	assert(typeof userConfig === 'object', 'The config has to be an object.');
	assert(typeof userConfig.rootDirectory === 'string', 'Please pass the root directory of the nitro project');

	// Default configuration
	const config = _.extend({
		// The root directory is required - just list it for documentation
		rootDirectory: '',
		// Schema filename
		schemaName: 'pattern.json',
		// Is a schema required
		useSchema: false,
		// Prerender handler to modify the data object
		preRenderHandler: (templateRenderData) => templateRenderData,
		// Prevalidate handler to modify the schema
		preValidateHandler: (schema) => schema,
		// Allows to set a custom error handler
		errorHandler: (err) => { throw err; }
	}, userConfig);

	/**
	 * handlebars helper: {{component ComponentName Data Variation}}
	 *
	 * Usage (simple)
	 * {{component "Button" "button-fancy"}}
	 *
	 * Usage (with children)
	 * {{#component "Button"}}Click Me{{/component}}
	 *
	 * Usage (passing arguments)
	 * {{#component "Button" disabled=true}}Click Me{{/component}}
   *
	 * @param {string} componentName the name of the component e.g. "base/atoms/button"
	 * @param {Object} handlebarsHelperContext the handlebars conext object
	 * @returns {string} rendered component
	 */
	return function component(componentName, handlebarsHelperContext) {
		try {
			assert(typeof componentName === 'string', 'componentName is required: e.g. {{component "base/atoms/button"}}');
			assert(arguments.length === 2, 'syntax error please use {{component "base/atoms/button" setting="value"}}');
			const templatePath = TemplateResolver.resolveTemplatePath(componentName, config.rootDirectory);
			// All neccessary information to render the component
			const componentInformation = {
				componentName,
				templateFile: templatePath,
				templateDirectory: path.dirname(templatePath),
				handlebarsHelperContext,
				config
			};
			// Get template schema
			const baseSchema = config.useSchema
				? TemplateValidator.getSchema(componentInformation.templateDirectory, config.schemaName)
				: null;
			// Allow to modify the schema instance
			componentInformation.templateSchema = config.preValidateHandler(
				baseSchema,
				componentInformation
			);
			// Get template render data
			const baseRenderData = TemplateResolver.getComponentRenderData(componentInformation);
			// Allow to modify the render data
			const componentRenderData = config.preRenderHandler(
				baseRenderData,
				componentInformation
			);
			// Validate render data
			if (config.useSchema) {
				TemplateValidator.validate(componentRenderData, componentInformation);
			}
			const componentTemplate = fs.readFileSync(templatePath).toString();
			// Render template
			return new hbs.handlebars.SafeString(
				hbs.handlebars.compile(componentTemplate)(componentRenderData, handlebarsHelperContext)
			);
		} catch (err) {
			return config.errorHandler(err, componentName);
		}
	};
}

module.exports = ComponentHandlebarsHelper;
