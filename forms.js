var forms = require('forms')
  , fields = forms.fields
  , validators = forms.validators;

exports.registration = forms.create({
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
