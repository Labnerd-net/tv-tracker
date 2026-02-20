import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { Formik } from 'formik';
import * as yup from 'yup';
import { loginUser } from '../apis/requests';
import useToken from '../hooks/useToken';

export default function Login() {
  const { setToken } = useToken();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');

  if (message) return <div>{message}</div>;

  const schema = yup.object().shape({
    email: yup.string()
      .email('Invalid email format')
      .required('Email is required'),
    password: yup.string()
      .min(8, 'Password must be at least 8 characters')
      .required('Password is required'),
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 8 }}>
      <Typography variant='h4' gutterBottom>Please Log In</Typography>
      <Formik
        initialValues={{ email: '', password: '' }}
        validationSchema={schema}
        onSubmit={async (values) => {
          setLoading(true);
          try {
            const token = await loginUser({
              email: values.email,
              password: values.password,
            });
            setToken(token);
          } catch (err) {
            if (err instanceof Error) {
              setMessage(err.message);
              console.error(`ERROR: ${err}`);
            }
          } finally {
            setLoading(false);
          }
        }}
      >
        {props => (
          <Box
            component='form'
            onSubmit={props.handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', maxWidth: 400 }}
          >
            <TextField
              type='email'
              label='Email'
              name='email'
              value={props.values.email}
              onChange={props.handleChange}
              error={props.touched.email && Boolean(props.errors.email)}
              helperText={props.touched.email && props.errors.email}
            />
            <TextField
              type='password'
              label='Password'
              name='password'
              value={props.values.password}
              onChange={props.handleChange}
              error={props.touched.password && Boolean(props.errors.password)}
              helperText={props.touched.password && props.errors.password}
            />
            <Button type='submit' variant='contained' disabled={loading}>
              {loading ? 'Logging in...' : 'Submit'}
            </Button>
          </Box>
        )}
      </Formik>
    </Box>
  );
}
