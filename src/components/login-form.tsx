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
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
};
export type CreateFormProps = {
  onSubmit?: SubmitHandler<CreateType>;
  defaultName?: string;
  nameLocked?: boolean;
};
export type JoinFormProps = {
  onSubmit?: SubmitHandler<JoinType>;
  defaultName?: string;
  nameLocked?: boolean;
};

export const LoginForm = ({
  onSubmit = () => {},
  defaultName = '',
  title = 'Welcome back',
  subtitle = 'Log in to continue your game',
  ctaLabel = 'Continue',
}: LoginFormProps) => {
  const { handleSubmit, control, reset } = useForm<FormType>({
    resolver: zodResolver(loginSchema),
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
      <View className="gap-4 p-4">
        <View className="items-center justify-center gap-2">
          <Text
            testID="form-title"
            className="text-center text-3xl font-extrabold"
          >
            {title}
          </Text>

          <Text className="mb-6 mt-2 max-w-xs text-center text-gray-500">
            {subtitle}
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
          label={ctaLabel}
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

export const CreateAccountForm = ({
  onSubmit = () => {},
  title = 'Welcome back',
  subtitle = 'Log in to continue your game',
  ctaLabel = 'Continue',
}: LoginFormProps) => {
  const { handleSubmit, control, reset } = useForm<FormType>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    reset((prev) => ({ ...prev }));
  }, [reset]);
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior="padding"
      keyboardVerticalOffset={10}
    >
      <View className="gap-4 p-4">
        <View className="items-center justify-center gap-2">
          <Text
            testID="form-title"
            className="text-center text-3xl font-extrabold"
          >
            {title}
          </Text>

          <Text className="mb-6 mt-2 max-w-xs text-center text-gray-500">
            {subtitle}
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
          label={ctaLabel}
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
  nameLocked = false,
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
      style={{ flex: 3 }}
      behavior="padding"
      keyboardVerticalOffset={10}
    >
      <View className="flex-1 justify-center rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl">
        <View className="items-center justify-center gap-2">
          <Text
            testID="form-title"
            className="text-center text-2xl font-extrabold text-slate-900"
          >
            Host a new game
          </Text>
        </View>

        <View className="mt-4 space-y-3 rounded-xl bg-slate-50/70 p-3">
          <ControlledInput
            testID="name"
            control={control}
            name="name"
            label="Name"
            disabled={nameLocked}
            editable={!nameLocked}
          />
          {nameLocked && (
            <Text className="text-xs font-medium text-slate-500">
              Your signed-in username is locked for this session.
            </Text>
          )}
        </View>
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
  nameLocked = false,
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
      <View className="flex-1 justify-center rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl">
        <View className="items-start justify-center gap-2">
          <Text
            testID="form-title"
            className="text-center text-2xl font-extrabold text-slate-900"
          >
            Join Game
          </Text>
        </View>

        <View className="mt-4 space-y-3 rounded-xl bg-slate-50/70 p-3">
          <ControlledInput
            testID="name"
            control={control}
            name="name"
            label="Name"
            disabled={nameLocked}
            editable={!nameLocked}
          />
          {nameLocked && (
            <Text className="text-xs font-medium text-slate-500">
              Signed-in users keep the same username when joining.
            </Text>
          )}

          <ControlledInput
            testID="game-id"
            control={control}
            name="id"
            label="Game ID"
            placeholder="e.g. ABC123"
          />
        </View>
        <Button
          testID="login-button"
          label="Join Game"
          onPress={handleSubmit(onSubmit)}
        />
      </View>
    </KeyboardAvoidingView>
  );
};
