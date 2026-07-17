"use client";

import { useState } from "react";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { auth } from "@/firebase/client";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import FormField from "./FormField";

import { signIn, signUp } from "@/lib/actions/auth.action";

import {
  CardBody,
  CardContainer,
  CardItem,
} from "@/components/ui/3d-card";

import { FiEye, FiEyeOff } from "react-icons/fi";

const Spinner = () => {
  return (
    <div className="w-5 h-5 border-2 border-black dark:border-white border-t-transparent rounded-full animate-spin" />
  );
};

const authFormSchema = (type: FormType) => {
  return z.object({
    name:
      type === "sign-up"
        ? z
            .string()
            .min(3, "Name must be at least 3 characters")
            .max(30, "Name is too long")
        : z.string().optional(),

    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),

    password: z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[!@#$%^&*(),.?":{}|<>]/,
    "Password must contain at least one special character"
  ),
  });
};

const AuthForm = ({ type }: { type: FormType }) => {

  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const isSignIn = type === "sign-in";

  const formSchema = authFormSchema(type);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      name:"",
      email: "",
      password: "",
    },
  });

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleForgotPassword = async () => {
    const email = form.getValues("email");

    if (!email) {
      toast.error("Please enter your email first.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent successfully.");
    } catch (error: any) {
      toast.error(error.message);
    }
  };
    const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setLoading(true);

    try {
      if (type === "sign-up") {
        const { name, email, password } = data;

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        // Send verification email
        await sendEmailVerification(userCredential.user);

        const result = await signUp({
          uid: userCredential.user.uid,
          name: name!,
          email,
          password,
        });

        if (!result.success) {
          toast.error(result.message);
          await userCredential.user.delete();
          setLoading(false);
          return;
        }

        toast.success(
          "🎉 Account created successfully! Please verify your email before signing in."
        );

        router.push("/sign-in");
      } else {
        const { email, password } = data;

        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

        // Email Verification Check
        if (!userCredential.user.emailVerified) {
          toast.error(
            "Please verify your email first. Check your inbox."
          );

          await signOut(auth);
          setLoading(false);
          return;
        }

        const idToken = await userCredential.user.getIdToken();

        const result = await signIn({
  email,
  idToken,
});

if (!result?.success) {
  toast.error(result?.message || "Sign in failed.");
  setLoading(false);
  return;
}

        toast.success("Welcome Back!");

        router.push("/");
      }
    } catch (error: any) {
      console.log(error);

      switch (error.code) {
        case "auth/email-already-in-use":
          toast.error("Email already registered.");
          break;

        case "auth/invalid-email":
          toast.error("Please enter a valid email.");
          break;

        case "auth/weak-password":
          toast.error("Password must contain at least 6 characters.");
          break;

        case "auth/invalid-credential":
          toast.error("Invalid email or password.");
          break;

        case "auth/user-not-found":
          toast.error("User not found.");
          break;

        case "auth/wrong-password":
          toast.error("Wrong password.");
          break;

        case "auth/network-request-failed":
          toast.error("No internet connection.");
          break;

        default:
          toast.error(error.message || "Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };
    return (
    <div className="flex justify-center items-center min-h-screen p-4">
      <CardContainer className="inter-var">
        <CardBody className="bg-white dark:bg-black border border-black/[0.1] dark:border-white/[0.2] sm:w-[36rem] rounded-2xl p-10 shadow-2xl min-h-[600px] flex flex-col justify-center items-center space-y-6">

          {/* Header */}
          <div className="flex flex-col items-center space-y-3">
            <CardItem
              translateZ="50"
              className="text-5xl font-extrabold text-primary-500 dark:text-white text-center"
            >
              <h1>{isSignIn ? "Welcome Back!" : "Create Account"}</h1>
            </CardItem>

            <CardItem
              translateZ="30"
              className="text-2xl text-neutral-600 dark:text-neutral-300 text-center"
            >
              AI Interview Platform
            </CardItem>
          </div>

          {/* Form */}
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="w-full space-y-6"
            >

              {!isSignIn && (
                <FormField
                  control={form.control}
                  name="name"
                  label="Full Name"
                  placeholder="Enter your full name"
                  type="text"
                />
              )}

              <FormField
                control={form.control}
                name="email"
                label="Email"
                placeholder="Enter your email"
                type="email"
              />

              <div className="relative">

                <FormField
                  control={form.control}
                  name="password"
                  label="Password"
                  placeholder="Enter password"
                  type={showPassword ? "text" : "password"}
                />

                <button
                  type="button"
                  onClick={togglePassword}
                  className="absolute right-3 top-[42px] cursor-pointer"
                >
                  {showPassword ? (
                    <FiEyeOff size={20} />
                  ) : (
                    <FiEye size={20} />
                  )}
                </button>

              </div>

              {isSignIn && (
                <div className="flex justify-end -mt-3">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-blue-500 text-sm hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <Spinner />
                ) : isSignIn ? (
                  "Sign In"
                ) : (
                  "Create Account"
                )}
              </Button>
                          </form>
          </Form>

          {/* Footer */}
          <div className="flex flex-col items-center space-y-3 mt-6">

            <CardItem
              translateZ={10}
              as="p"
              className="text-sm text-center text-neutral-600 dark:text-neutral-400"
            >
              {isSignIn
                ? "Don't have an account?"
                : "Already have an account?"}

              <Link
                href={isSignIn ? "/sign-up" : "/sign-in"}
                className="ml-2 font-semibold text-primary-600 hover:underline"
              >
                {isSignIn ? "Sign Up" : "Sign In"}
              </Link>
            </CardItem>

            {!isSignIn && (
              <CardItem
                translateZ={10}
                as="p"
                className="text-xs text-center text-green-500"
              >
                📩 A verification email will be sent after registration.
              </CardItem>
            )}

          </div>

        </CardBody>
      </CardContainer>
    </div>
  );
};

export default AuthForm;