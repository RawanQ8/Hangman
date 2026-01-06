import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import * as z from 'zod';

import { Button, ControlledInput, Text, View } from '@/components/ui';

const loginSchema = z.object({
  name: z.string({
    required_error: 'Username is required',
  }),
  email: z.string().email('Invalid email format').optional(),
  password: z
    .string({
      required_error: 'Password is required',
    })
    .min(6, 'Password must be at least 6 characters'),
});

const newGameSchema = z.object({
  name: z.string({
    required_error: 'Username is requiered',
  }),
});

const joinGameSchema = z.object({
  name: z.string({
    required_error: 'Username is required',
  }),
  id: z.string({
    required_error: 'Game ID is required',
  }),
});

export type FormType = z.infer<typeof loginSchema>;
export type CreateType = z.infer<typeof newGameSchema>;
export type JoinType = z.infer<typeof joinGameSchema>;

export type LoginFormProps = {
  onSubmit?: SubmitHandler<FormType>;
  defaultName?: string;
};
export type CreateFormProps = {
  onSubmit?: SubmitHandler<CreateType>;
  defaultName?: string;
};
export type JoinFormProps = {
  onSubmit?: SubmitHandler<JoinType>;
  defaultName?: string;
};

export const LoginForm = ({ onSubmit = () => {} }: LoginFormProps) => {
  const { handleSubmit, control } = useForm<FormType>({
    resolver: zodResolver(loginSchema),
  });
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior="padding"
      keyboardVerticalOffset={10}
    >
      <View className="flex-1 justify-center p-4">
        <View className="items-center justify-center">
          <Text testID="form-title" className=" text-center text-4xl font-bold">
            Create Account
          </Text>
          <Text
            testID="form-title"
            className="pb-6 text-center text-4xl font-bold"
          >
            or Login
          </Text>

          <Text className="mb-6 max-w-xs text-center text-gray-500">
            Welcome! 👋 Create an account so that you can collect points and
            compete with your friends on the leaderboard
          </Text>
        </View>

        <ControlledInput
          testID="name"
          control={control}
          name="name"
          label="Username"
        />

        <ControlledInput
          testID="password-input"
          control={control}
          name="password"
          label="Password"
          placeholder="***"
          secureTextEntry={true}
        />

        <Button
          testID="login-button"
          label="Login"
          onPress={handleSubmit(onSubmit)}
        />

        {/* <ControlledInput
          testID="email-input"
          control={control}
          name="email"
          label="Email"
        /> */}
      </View>
    </KeyboardAvoidingView>
  );
};

export const NewGameForm = ({
  onSubmit = () => {},
  defaultName = '',
}: CreateFormProps) => {
  const { handleSubmit, control, reset } = useForm<CreateType>({
    resolver: zodResolver(newGameSchema),
    defaultValues: { name: defaultName },
  });

  useEffect(() => {
    reset((prev) => ({ ...prev, name: defaultName }));
  }, [defaultName, reset]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior="padding"
      keyboardVerticalOffset={10}
    >
      <View className="flex-1 justify-center p-4">
        <View className="items-center justify-center">
          <Text
            testID="form-title"
            className="pb-6 text-center text-4xl font-bold"
          >
            New Game
          </Text>

          <Text className="mb-6 max-w-xs text-center text-gray-500">
            Create a new game
          </Text>
        </View>

        <ControlledInput
          testID="name"
          control={control}
          name="name"
          label="Name"
        />
        <Button
          testID="login-button"
          label="Create Game"
          onPress={handleSubmit(onSubmit)}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

export const JoinGameForm = ({
  onSubmit = () => {},
  defaultName = '',
}: JoinFormProps) => {
  const { handleSubmit, control, reset, getValues } = useForm<JoinType>({
    resolver: zodResolver(joinGameSchema),
    defaultValues: { name: defaultName, id: '' },
  });

  useEffect(() => {
    // Preserve game ID while updating name
    const currentId = getValues('id');
    reset({ name: defaultName, id: currentId });
  }, [defaultName, getValues, reset]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior="padding"
      keyboardVerticalOffset={10}
    >
      <View className="flex-1 justify-center p-4">
        <View className="items-center justify-center">
          <Text
            testID="form-title"
            className="pb-6 text-center text-4xl font-bold"
          >
            Join Game
          </Text>

          <Text className="mb-6 max-w-xs text-center text-gray-500">
            Enter your name and the game code to join.
          </Text>
        </View>

        <ControlledInput
          testID="name"
          control={control}
          name="name"
          label="Name"
        />

        <ControlledInput
          testID="game-id"
          control={control}
          name="id"
          label="Game ID"
          placeholder="e.g. ABC123"
        />
        <Button
          testID="login-button"
          label="Join Game"
          onPress={handleSubmit(onSubmit)}
        />
      </View>
    </KeyboardAvoidingView>
  );
};
