# A gentle guide to Submodules

*- Written by a totally qualified github expert*



Submodules are repositories that are contained inside another repository (called the supermodule). The supermodule doesn't actually contain all the **code** of the submodule, but instead just have a special pointer-like object to the submodule **repo** and its commit. This can be seen when you look at a particular commit of a supermodule:

Git knows that a particular folder is a submodule by storing the info inside the `.gitmodule` file. 

Submodules are great as they add modularisation. This is useful when you use 3rd party libraries or have multiple conceptually independent projects that work together to make a larger project. Instead of copying all the code into one gigantic repo and having all the changes mashed together into commits, submodules each have their own commit history and the supermodule just points to the desired commit of each submodule.



**Adding a submodule** modifies the .gitmodule file (which specifies submodule locations locally and their url remotely) and adds submodules as essentially pointers to the repo with a particular commit. Make sure you commit this change to add the submodule.

- `git submodule add <url>`: Add submodule in folder with same name to the current directory
- `git submodule add <url> <path>`: Add submodule to directory of that path



**Cloning into a file with submodules** include 2 extra steps you need to do after `git clone`: (1) get the submodule info and (2) get the submodule content of the commit the supermodule points to. The relevant commands are given below. When you clone the supermodule repo, the submodules are empty folders. You need (2) to get the code on your local machine.

You might have to do this recursively if you have recursive submodules

- `git submodule init`: Initialise the submodules (adding some info to .git/config etc.) (1)
- `git submodule update`: Download submodule content (2)
- `git submodule update --init`: The above 2 combined
- `git submodule update --init --resursive`: Also download data recursively for nested submodules
- `git pull --recurse-submodules`: pull and update submodule content recursively, also adding new submodules if there are any. This is essentially everything combined, equivalent to `git pull`; `git submodule update --init --recursive`



**Pulling updates from the supermodule** need `git submodule update` besides `git pull`. Say your teammate added some changes to the supermodule (eg. changing its README file). The new commit includes these changes, perhaps with some updates on the submodules where it now point to new commits of the submodules. To get these changes, you do `git pull`, which fetches the new commit and merges it into your current branch. `git pull` also lets the local git repo know that the submodules are pointing at the newer commits. However, it **doesn't update the submodule content**. (This could be useful. Perhaps the code you are working on right now breaks with the newer version of the submodules)

To get the new submodule content, do `git submodule update`. This will download and modify the code in the submodule to be exactly what it looks like in the commit the supermodule is pointing at.

Sometimes you might want to do ` git submodule update --init --recursive`. The `--init` flag adds new submodules which may be introduced in the new supermodule commit. The `--recursive` update the content recursively. So in fact, you could just again do `git pull --recurse-submodules` to combine all the steps to pull updates from the supermodule.



**Making changes**

Now remember, the supermodule sees every submodule as just a pointer to another repo and its commit. If you make changes to the local submodule code and push it into the supermodule, the changes will be lost. The correct way of doing this consist of (1) make changes in the submodule and push it to the submodule repo and (2) update the pointer in the supermodule to point to the newer commits of the submodules. 

Fortunately, git has a clever way of managing this. When you are in the supermodule directory, the output of `git branch` are the branches of the supermodule. When you `cd` into a submodule, the branches you see are the submodule branches. In fact, when you are inside the submodule folder, everything works as if you are in that repo and the supermodule doesn't exist. You can create branches, commit changes etc. So to make changes, just `cd` into the submodule directory, checkout a branch, and commit changes.

*: By default all the submodules have a detached HEAD, aka. there is no current branch. This is to make things simpler, as most of the time submodules are not being edited. To edit, simply checkout a branch.

Now say you've made some changes and you are ready to push the new local commits of submodules to the remote repo.

**First, pull any new changes that happened while you were editing**

- Go back to supermodule directory and do `git submodule update --remote --merge`. This will get the newest commit from submodules and merge them into their current branch.

=> What if I accidentally did `git submodule update` (without the --remote flag) and I lost my changes?

- `git submodule update` will download and refresh the submodules to be the state of the commit pointed by the supermodule, and detach the HEAD of the submodule. To get your changes back, simply `cd` back into the submodule and checkout the branch you were working on.

**Next, push your changes**

- To push, go to each submodule you changed and push to their remote. Then, go to the supermodule and first do `git submodule update --remote --merge` (to get update the supermodule to point to the newer commits for the submodules (which you just pushed)), then push to remote.
- You can also just go to the supermodule and do `git push --recurse-submodules=on-demand`, which will push all submodules for you before pushing the supermodule. Though sometimes this doesn't work so it's better to do the first option. (I haven't got it to work)



**Useful aliases**

```python
# In the supermodule, diff will only give you changes in the supermodule code and not the submodule code
git config --global alias.sdiff '!'"git diff && git submodule foreach 'git diff'"

# Pull changes from the supermodule and refresh the content for submodules determined by the commit specified in the supermodule
git config --global alias.spull 'pull --recurse-submodules'

# If the above doesn't work, do this after you do `git pull`
git config --global alias.srefresh 'submodule update --init --recursive'

# Fetch newer commits from the submodules and merge it with their current branches, also update the commit pointer in the supermodule
git config --global alias.supdate 'submodule update --remote --merge'

# Push for each submodule then push on the supermodule
git config --global alias.spush 'push --recurse-submodules=on-demand'
```



**Summary and commands for common workflow**

```python
# Cloning into master repo
git clone https://github.com/yumium/microbit-ML
git srefresh # this could take a while the first time

...few days later

# Pulling new updates upstream
git spull (git pull --recursive-submodules)

# If git spull didn't update the submodules, do the following equivalent commands instead
git pull
git srefresh

# Add some changes to a submodule
cd PythonEditor
git checkout master
...make some changes
git commit -a -m "Added some stuff"

# Ready to push the changes upstream
# 1. Pull first for submodules
cd ..
git supdate (git submodule update --remote --merge)
# 2. Push local commit to submodule remote repo
cd PythonEditor
git push origin master
# 3. Update supermodule so it pointers to newer commit of submodules
cd ..
git supdate
# 4. Pull and push for supermodule
git commit -a -m "Update Python submodule version"
git pull
git push
```



**IMPORTANT**

As we are using the v1.13 micropython (repo is at `microbit-ML/micropython-microbit-v2/lib/micropython`), I have created a new branch called **stable** that is currently pointing at the v1.13 commit. Please pull and push to that branch. I have set up the `.gitmodules` file to track that branch when refreshing submodules.