#!/usr/bin/perl

use Cwd qw( abs_path );
use File::Basename qw( dirname );
use lib dirname(abs_path($0));

die "Environment not set" unless $ENV{CLOCKWORKSSH};

system('pnpm build');

system("rsync -avz -e ssh dist/ $ENV{CLOCKWORKSSH}:clockwork/swolog/") unless $?;

