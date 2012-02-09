var forms = require('forms')
  , fields = forms.fields
  , validators = forms.validators;

exports.registration = forms.create({
    first_name: fields.string({required: false}),
    last_name: fields.string({required: false}),
    username: fields.string({required: true}),
    password: fields.password({required: true}),
    confirm:  fields.password({
        required: true,
        validators: [validators.matchField('password')]
    }),
    email: fields.email()
});

exports.authentication = forms.create({
    username: fields.string({required: true}),
    password: fields.password({required: true})
});
